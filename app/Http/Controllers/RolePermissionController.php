<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Employee;
use App\Models\Organization;
use Illuminate\Validation\ValidationException;

class RolePermissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get all organizations for the user
        $organizations = Organization::where('user_id', $user->id)->get();
        
        // Determine active organization
        $organizationId = $request->query('organization_id');
        $activeOrganization = null;

        if ($organizationId) {
            $activeOrganization = $organizations->where('id', $organizationId)->first();
        }

        if (!$activeOrganization) {
            // Default to first organization if available
            $activeOrganization = $organizations->first();
        }

        if (!$activeOrganization) {
            // Handle case where user has no organizations (though middleware should prevent this)
            return Inertia::render('permissions', [
                'roles' => [],
                'permissions' => [],
                'organizations' => [],
                'currentOrganization' => null,
            ]);
        }

        // Get roles for the active organization
        $roles = Role::where('organization_id', $activeOrganization->id)
                     ->with('permissions')
                     ->get();
                     
        $permissions = Permission::all();

        // Calculate employee count for each role IN THIS ORGANIZATION
        $roleCounts = Employee::where('organization_id', $activeOrganization->id)
            ->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        $roles->transform(function ($role) use ($roleCounts) {
            $role->users_count = $roleCounts[$role->name] ?? 0;
            return $role;
        });

        return Inertia::render('permissions', [
            'roles' => $roles,
            'permissions' => $permissions,
            'organizations' => $organizations,
            'currentOrganization' => $activeOrganization,
        ]);
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
            'organization_id' => 'required|exists:organizations,id',
        ]);

        // Check for duplicate role name within the organization
        $exists = Role::where('name', $validated['name'])
                      ->where('organization_id', $validated['organization_id'])
                      ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['name' => 'A role with this name already exists in this organization.']);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'organization_id' => $validated['organization_id']
        ]);
        
        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role permissions updated successfully.');
    }

    public function destroyRole(Role $role)
    {
        $role->delete();
        return redirect()->back()->with('success', 'Role deleted successfully.');
    }
}
