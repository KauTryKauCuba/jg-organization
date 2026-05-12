<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Organization;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Spatie\Permission\PermissionRegistrar;

use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get all organizations for the user (as owner or member)
        // If user is not an owner, they might be an employee.
        // We need to check permissions here.
        // For now, let's assume if they can access this page, they can see employees in their organizations.
        
        $employees = Employee::withTrashed()
            ->whereHas('organization', function ($query) use ($user) {
                // Check if user is the owner of the organization OR belongs to it as an employee
                $query->where('user_id', $user->id)
                      ->orWhereHas('employees', function ($q) use ($user) {
                          $q->where('email', $user->email);
                      });
            })
            ->with(['organization' => function ($query) {
                $query->withTrashed();
            }, 'manager' => function ($query) {
                $query->withTrashed();
            }, 'directReports' => function ($query) {
                $query->withTrashed();
            }])
            ->get();
        
        // Filter organizations for the dropdown
        // User can only add employees to organizations where they have permission
        // We'll check permissions in the frontend or backend validation
        $organizations = Organization::where('user_id', $user->id)
            ->orWhereHas('employees', function ($q) use ($user) {
                $q->where('email', $user->email);
            })->get(); 

        // Fetch roles for these organizations
        $roles = \App\Models\Role::whereIn('organization_id', $organizations->pluck('id'))
            ->select('id', 'name', 'organization_id')
            ->get()
            ->groupBy('organization_id');

        // Fetch all unique role names for the dropdown (Global List)
        $allRoles = \App\Models\Role::distinct()->pluck('name')->sort()->values();

        return Inertia::render('employee', [
            'employees' => $employees,
            'organizations' => $organizations,
            'availableRoles' => $roles,
            'allRoles' => $allRoles
        ]);
    }

    public function store(Request $request)
    {
        if ($request->input('manager_id') === 'none') {
            $request->merge(['manager_id' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('employees')->where(function ($query) use ($request) {
                    return $query->where('organization_id', $request->input('organization_id'));
                }),
            ],
            'role' => 'required|string|max:255',
            'organization_id' => [
                'required',
                Rule::exists('organizations', 'id')->where(function ($query) use ($request) {
                    // Check if user is owner OR member of the organization
                    $query->where('user_id', $request->user()->id)
                          ->orWhere(function($q) use ($request) {
                              $q->whereExists(function ($sub) use ($request) {
                                  $sub->select(DB::raw(1))
                                      ->from('employees')
                                      ->whereColumn('employees.organization_id', 'organizations.id')
                                      ->where('employees.email', $request->user()->email)
                                      ->whereNull('employees.deleted_at');
                              });
                          });
                }),
            ],
            'manager_id' => 'nullable|exists:employees,id',
        ]);

        // Check Permissions
        $org = Organization::findOrFail($validated['organization_id']);
        setPermissionsTeamId($validated['organization_id']);
        if ($org->user_id !== $request->user()->id && !$request->user()->can('manage_employees')) {
            abort(403, 'You do not have permission to add employees to this organization.');
        }

        $employee = Employee::create($validated);

        // Assign Spatie Role if User exists
        $user = User::where('email', $validated['email'])->first();
        if ($user) {
            setPermissionsTeamId($validated['organization_id']);
            
            $roleName = $validated['role'];
            
            // Check if role exists in this organization
            if (\App\Models\Role::where('name', $roleName)->where('organization_id', $validated['organization_id'])->exists()) {
                // Remove previous roles for this team and assign new one
                // Spatie's syncRoles handles this per guard/team if setPermissionsTeamId is used correctly
                $user->syncRoles([$roleName]);
            } else {
                // If the role string doesn't match an existing role, we might want to log it or default
                // But since we want to support dynamic roles eventually, maybe we just don't assign a Spatie role yet
                // or default to 'Employee'
                // For now, let's try to assign 'Employee' as a safe fallback if it exists
                if (\App\Models\Role::where('name', 'Employee')->where('organization_id', $validated['organization_id'])->exists()) {
                    $user->syncRoles(['Employee']);
                }
            }
        }

        return redirect()->back()->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        // Check permissions for the current organization of the employee
        $currentOrg = Organization::findOrFail($employee->organization_id);
        setPermissionsTeamId($employee->organization_id);
        if ($currentOrg->user_id !== $request->user()->id && !$request->user()->can('manage_employees')) {
            abort(403, 'You do not have permission to edit employees in this organization.');
        }

        if ($request->input('manager_id') === 'none') {
            $request->merge(['manager_id' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('employees')->where(function ($query) use ($employee, $request) {
                    return $query->where('organization_id', $request->input('organization_id'))
                                 ->whereNull('deleted_at'); // Assuming soft deletes
                })->ignore($employee->id),
            ],
            'role' => 'required|string|max:255',
            'organization_id' => [
                'required',
                Rule::exists('organizations', 'id')->where(function ($query) use ($request) {
                    // Check if user is owner OR member of the organization
                    $query->where('user_id', $request->user()->id)
                          ->orWhere(function($q) use ($request) {
                              $q->whereExists(function ($sub) use ($request) {
                                  $sub->select(DB::raw(1))
                                      ->from('employees')
                                      ->whereColumn('employees.organization_id', 'organizations.id')
                                      ->where('employees.email', $request->user()->email)
                                      ->whereNull('employees.deleted_at');
                              });
                          });
                }),
            ],
            'manager_id' => 'nullable|exists:employees,id|not_in:'.$employee->id,
        ]);

        // If organization is changing, check permission for the new organization
        if ($validated['organization_id'] != $employee->organization_id) {
             $targetOrg = Organization::findOrFail($validated['organization_id']);
             setPermissionsTeamId($validated['organization_id']);
             if ($targetOrg->user_id !== $request->user()->id && !$request->user()->can('manage_employees')) {
                 abort(403, 'You do not have permission to move employees to the target organization.');
             }
        }

        $employee->update($validated);
        
        // Update Spatie Role if User exists
        $user = User::where('email', $validated['email'])->first();
        if ($user) {
            setPermissionsTeamId($validated['organization_id']);
            
            $roleName = $validated['role'];
            
            if (\App\Models\Role::where('name', $roleName)->where('organization_id', $validated['organization_id'])->exists()) {
                $user->syncRoles([$roleName]);
            }
        }

        return redirect()->back()->with('success', 'Employee updated successfully.');
    }

    public function destroy(Request $request, Employee $employee)
    {
        $org = Organization::findOrFail($employee->organization_id);
        setPermissionsTeamId($employee->organization_id);
        if ($org->user_id !== $request->user()->id && !$request->user()->can('manage_employees')) {
            abort(403, 'You do not have permission to delete employees.');
        }

        $employee->delete();

        return redirect()->back()->with('success', 'Employee deleted successfully. Data is kept and can be restored.');
    }

    public function restore(Request $request, $id)
    {
        // Need to find the employee first, even if trashed
        // We can't rely on route binding for trashed models easily without explicit binding
        $employee = Employee::withTrashed()->findOrFail($id);
        
        $org = Organization::findOrFail($employee->organization_id);
        setPermissionsTeamId($employee->organization_id);
        if ($org->user_id !== $request->user()->id && !$request->user()->can('manage_employees')) {
             abort(403, 'You do not have permission to restore employees.');
        }
        
        $employee->restore();

        return redirect()->back()->with('success', 'Employee restored successfully.');
    }
}
