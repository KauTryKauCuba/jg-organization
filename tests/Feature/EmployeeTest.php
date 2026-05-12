<?php

/** @var \Tests\TestCase $this */

use App\Models\User;
use App\Models\Employee;
use App\Models\Organization;




test('guests are redirected to the login page', function () {
    $response = $this->get(route('employee'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the employee page', function () {
    $user = User::factory()->create();
    Organization::create(['name' => 'Test Organization', 'user_id' => $user->id]);
    $this->actingAs($user);

    $response = $this->get(route('employee'));
    $response->assertOk();
});

test('authenticated users can create an employee', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Test Organization', 'user_id' => $user->id]);
    
    $this->actingAs($user);

    $response = $this->post(route('employee.store'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'role' => 'Developer',
        'organization_id' => $organization->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('employees', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
});

test('authenticated users can update an employee', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Test Organization', 'user_id' => $user->id]);
    $employee = Employee::create([
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'role' => 'Designer',
        'organization_id' => $organization->id,
    ]);
    
    $this->actingAs($user);

    $response = $this->put(route('employee.update', $employee), [
        'name' => 'Jane Smith',
        'email' => 'jane@example.com',
        'role' => 'Senior Designer',
        'organization_id' => $organization->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('employees', [
        'id' => $employee->id,
        'name' => 'Jane Smith',
        'role' => 'Senior Designer',
    ]);
});

test('authenticated users can delete an employee', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Test Organization', 'user_id' => $user->id]);
    $employee = Employee::create([
        'name' => 'Bob Doe',
        'email' => 'bob@example.com',
        'role' => 'Manager',
        'organization_id' => $organization->id,
    ]);
    
    $this->actingAs($user);

    $response = $this->delete(route('employee.destroy', $employee));

    $response->assertRedirect();
    $this->assertSoftDeleted($employee);
});

test('authenticated users can restore an employee', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Test Organization', 'user_id' => $user->id]);
    $employee = Employee::create([
        'name' => 'Alice Doe',
        'email' => 'alice@example.com',
        'role' => 'Tester',
        'organization_id' => $organization->id,
    ]);
    $employee->delete();
    
    $this->actingAs($user);

    $response = $this->post(route('employee.restore', $employee->id));

    $response->assertRedirect();
    $this->assertDatabaseHas('employees', [
        'id' => $employee->id,
        'deleted_at' => null,
    ]);
});
