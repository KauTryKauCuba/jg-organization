<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class SyncRolesSeeder extends Seeder
{
    public function run()
    {
        // 1. Get all unique roles from employees table
        $employeeRoles = Employee::distinct()->pluck('role')->filter();

        foreach ($employeeRoles as $roleName) {
            // Create role if it doesn't exist (Global role for now)
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            
            // Assign some default permissions if it has none
            if ($role->permissions->isEmpty()) {
                // Create some basic permissions if they don't exist
                $permissions = [
                    'view dashboard',
                    'view organization',
                    'view employees',
                ];
                
                foreach ($permissions as $perm) {
                    Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
                }
                
                $role->givePermissionTo($permissions);
            }
        }
    }
}
