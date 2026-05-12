<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Organization;
use App\Models\Employee;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test01@gmail.com'],
            [
                'name' => 'Test User 01',
                'password' => bcrypt('password'),
            ]
        );

        $organization = Organization::firstOrCreate(
            ['name' => 'Jobgiga', 'user_id' => $user->id],
            ['parent_id' => null]
        );

        // Add user as HR Manager to ALL organizations
        $organizations = Organization::all();
        
        foreach ($organizations as $org) {
            Employee::firstOrCreate(
                [
                    'email' => 'test01@gmail.com',
                    'organization_id' => $org->id
                ],
                [
                    'name' => 'Test User 01',
                    'role' => 'HR Manager',
                    'manager_id' => null,
                ]
            );
        }
    }
}
