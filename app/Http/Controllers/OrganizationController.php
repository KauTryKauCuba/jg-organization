<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\Employee;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\Log;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Get owned organizations
        $ownedOrgs = Organization::withTrashed()
            ->where('user_id', $user->id)
            ->with(['children' => function ($query) {
                $query->withTrashed();
            }]) // Eager load children to get their IDs
            ->get();

        // 2. Collect all relevant IDs (Owned + Parents + All Descendants)
        $ownedIds = $ownedOrgs->pluck('id')->toArray();
        $parentIds = $ownedOrgs->pluck('parent_id')->filter()->toArray();
        
        // Recursively find all descendant IDs
        $allDescendantIds = [];
        $currentParentIds = $ownedIds;
        
        // Safety limit for recursion depth to avoid infinite loops
        $depth = 0;
        while (!empty($currentParentIds) && $depth < 10) {
            $childrenIds = Organization::withTrashed()
                ->whereIn('parent_id', $currentParentIds)
                ->pluck('id')
                ->toArray();
            
            if (empty($childrenIds)) {
                break;
            }
            
            // Filter out any IDs we've already seen to prevent cycles
            $newChildrenIds = array_diff($childrenIds, $allDescendantIds, $ownedIds, $parentIds);
            
            if (empty($newChildrenIds)) {
                break;
            }

            $allDescendantIds = array_merge($allDescendantIds, $newChildrenIds);
            $currentParentIds = $newChildrenIds;
            $depth++;
        }
        
        // Merge and unique
        $allIds = array_unique(array_merge($ownedIds, $parentIds, $allDescendantIds));

        // 3. Fetch all organizations
        $organizations = Organization::withTrashed()
            ->whereIn('id', $allIds)
            ->with(['parent' => function ($query) {
                $query->withTrashed();
            }, 'children' => function ($query) {
                $query->withTrashed();
            }, 'employees' => function ($query) {
                $query->withTrashed()->with('manager');
            }])->withCount('employees')->get();
        
        // Fetch pending invitations where the current user's organizations are the RECEIVER
        // We need to get all org IDs owned by user first
        $userOrgIds = $ownedIds; // Use ownedIds, not allIds, for invitation logic (only I can accept for MY orgs)
        
        $pendingInvitations = OrganizationInvitation::whereIn('receiver_org_id', $userOrgIds)
            ->where('status', 'pending')
            ->with(['sender', 'receiver'])
            ->get();

        // Fetch invitations where I am the SENDER and the receiver has ACCEPTED (Waiting for my confirmation)
        $pendingConfirmations = OrganizationInvitation::whereIn('sender_org_id', $userOrgIds)
            ->where('status', 'accepted')
            ->with(['sender', 'receiver'])
            ->get();

        // Fetch invitations where I am the SENDER and status is PENDING (Waiting for receiver to accept)
        $sentPendingInvitations = OrganizationInvitation::whereIn('sender_org_id', $userOrgIds)
            ->where('status', 'pending')
            ->with(['sender', 'receiver'])
            ->get();

        // Fetch invitations where I am the RECEIVER and status is ACCEPTED (Waiting for sender to confirm)
        $acceptedInvitations = OrganizationInvitation::whereIn('receiver_org_id', $userOrgIds)
            ->where('status', 'accepted')
            ->with(['sender', 'receiver'])
            ->get();

        // Fetch all unique role names for the dropdown
        $availableRoles = \App\Models\Role::distinct()->pluck('name')->sort()->values();

        return Inertia::render('organization', [
            'organizations' => $organizations,
            'pendingInvitations' => $pendingInvitations,
            'pendingConfirmations' => $pendingConfirmations,
            'sentPendingInvitations' => $sentPendingInvitations,
            'acceptedInvitations' => $acceptedInvitations,
            'availableRoles' => $availableRoles
        ]);
    }

    public function store(Request $request)
    {
        if ($request->input('parent_id') === 'none') {
            $request->merge(['parent_id' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:organizations,id',
            'subsidiary_id' => 'nullable|exists:organizations,id',
            'modal_type' => 'nullable|string|in:parent,subsidiary,normal',
            'role' => 'nullable|string|max:255',
        ]);

        // If subsidiary_id is provided, we might want to inherit its parent
        // Only do this if we are explicitly adding a parent (insertion logic)
        if ($request->input('modal_type') === 'parent' && !empty($validated['subsidiary_id'])) {
            $subsidiary = Organization::where('user_id', $request->user()->id)->find($validated['subsidiary_id']);
            // If the user selected a specific parent in the form, use that.
            // Otherwise, if they left it as 'none' (null), inherit the subsidiary's parent to perform an insertion.
            if ($subsidiary && is_null($validated['parent_id'])) {
                $validated['parent_id'] = $subsidiary->parent_id;
            }
        }

        // Add user_id to validated data
        $validated['user_id'] = $request->user()->id;

        $organization = Organization::create($validated);

        // Always ensure the creator is an employee of this new organization
        // We use firstOrCreate to avoid duplicates if for some reason it ran twice
        $employee = Employee::firstOrCreate(
            [
                'email' => $request->user()->email,
                'organization_id' => $organization->id,
            ],
            [
                'name' => $request->user()->name,
                'role' => $validated['role'] ?? 'Owner', // Default to Owner if not provided
                // manager_id is null for the top-level HR Manager
            ]
        );

        // Assign Spatie Role 'super-admin' for this organization
        $user = $request->user();
        
        // Initialize roles for this organization
        $this->initializeOrganizationRoles($organization);
        
        setPermissionsTeamId($organization->id);
        
        // Assign the role selected in the form, or default to 'Owner'/'CEO' or similar if not specified
        // For now, if role is provided use it, otherwise 'Owner' seems appropriate for the creator
        $roleToAssign = $validated['role'] ?? 'Owner';
        
        // Ensure the role exists (it should, as we just initialized them)
        // If the user provided a custom role string that isn't in our standard list, we might want to create it or fallback.
        // But for now, let's assume standard roles or we create it if missing.
        $roleExists = \App\Models\Role::where('name', $roleToAssign)
            ->where('organization_id', $organization->id)
            ->exists();

        if (!$roleExists) {
             // Fallback to Owner if the requested role doesn't exist in our standard set
             $roleToAssign = 'Owner';
        }
        
        $user->assignRole($roleToAssign);

        // If subsidiary_id is present, update that organization's parent_id to the new organization
        if ($request->input('modal_type') === 'parent' && !empty($validated['subsidiary_id'])) {
            $subsidiary = Organization::where('user_id', $request->user()->id)->find($validated['subsidiary_id']);
            if ($subsidiary) {
                $subsidiary->parent_id = $organization->id;
                $subsidiary->save();
            }
        }

        if (session()->has('pending_invitation_url')) {
            $url = session()->pull('pending_invitation_url');
            return Inertia::location($url); // Use Inertia::location for full page reload/redirect to external or different route structure
        }

        return redirect()->route('dashboard')->with('success', 'Organization created successfully.');
    }

    private function initializeOrganizationRoles(Organization $organization)
    {
        setPermissionsTeamId($organization->id);
        
        // Define role groups and their permissions
        $roleGroups = [
            'level_1' => [
                'roles' => ['Super Admin', 'HR Director', 'HR Manager', 'Owner', 'Founder', 'CEO'],
                'permissions' => ['manage_everything']
            ],
            'level_2' => [
                'roles' => ['Admin', 'HR Officer'],
                'permissions' => ['admin_access', 'manage_employees', 'view_all_details']
            ],
            'level_3' => [
                'roles' => ['Manager', 'Department Manager', 'Hiring Manager'],
                'permissions' => ['manager_access', 'view_team_details', 'manage_team']
            ],
            'level_4' => [
                'roles' => ['Staff / User (Limited Access)', 'Staff', 'Coordinator', 'Employee'],
                'permissions' => ['basic_access', 'view_own_profile']
            ]
        ];

        // Ensure all permissions exist
        $allPermissions = [];
        foreach ($roleGroups as $group) {
            foreach ($group['permissions'] as $permName) {
                $allPermissions[] = $permName;
            }
        }
        $allPermissions = array_unique($allPermissions);

        foreach ($allPermissions as $permName) {
            \Spatie\Permission\Models\Permission::firstOrCreate(
                ['name' => $permName, 'guard_name' => 'web']
            );
        }

        // Create Roles and Assign Permissions
        foreach ($roleGroups as $group) {
            foreach ($group['roles'] as $roleName) {
                $role = \App\Models\Role::firstOrCreate([
                    'name' => $roleName,
                    'organization_id' => $organization->id,
                    'guard_name' => 'web'
                ]);

                // Sync permissions for this role
                $role->syncPermissions($group['permissions']);
            }
        }
    }

    public function update(Request $request, Organization $organization)
    {
        setPermissionsTeamId($organization->id);
        if ($organization->user_id !== $request->user()->id && !$request->user()->can('manage_everything')) {
            abort(403, 'You do not have permission to update this organization.');
        }

        if ($request->input('parent_id') === 'none') {
            $request->merge(['parent_id' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:organizations,id|not_in:'.$organization->id,
        ]);

        $organization->update($validated);

        return redirect()->back()->with('success', 'Organization updated successfully.');
    }

    public function destroy(Request $request, Organization $organization)
    {
        setPermissionsTeamId($organization->id);
        if ($organization->user_id !== $request->user()->id && !$request->user()->can('manage_everything')) {
            abort(403, 'You do not have permission to delete this organization.');
        }

        $organization->delete();

        return redirect()->back()->with('success', 'Organization deleted successfully. Data is kept and can be restored.');
    }

    public function restore(Request $request, $id)
    {
        // Need to find organization first
        $organization = Organization::withTrashed()->findOrFail($id);

        setPermissionsTeamId($organization->id);
        if ($organization->user_id !== $request->user()->id && !$request->user()->can('manage_everything')) {
             abort(403, 'You do not have permission to restore this organization.');
        }

        $organization->restore();

        return redirect()->back()->with('success', 'Organization restored successfully.');
    }
}
