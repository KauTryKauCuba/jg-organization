<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Employee;
use Spatie\Permission\PermissionRegistrar;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Find all employee records matching this user's email
        $employees = Employee::where('email', $user->email)->get();

        foreach ($employees as $employee) {
            setPermissionsTeamId($employee->organization_id);
            
            // Map the role string to a Spatie Role
            $spatieRole = ($employee->role === 'HR Manager') ? 'HR Manager' : 'Employee';
            
            try {
                $user->assignRole($spatieRole);
            } catch (\Exception $e) {
                // Ignore if role not found or other error
            }
        }
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        //
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
