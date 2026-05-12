<?php

/** @var \Tests\TestCase $this */

use App\Models\User;
use App\Models\Organization;




test('guests are redirected to the login page', function () {
    $response = $this->get(route('organization'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the organization page', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Existing Org', 'user_id' => $user->id]);
    $this->actingAs($user);

    $response = $this->get(route('organization'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('organization')
        ->has('organizations')
    );
});

test('authenticated users without organizations are redirected to onboarding', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('onboarding.welcome'));
    
    $response = $this->get(route('organization'));
    $response->assertRedirect(route('onboarding.welcome'));
});

test('onboarding page is accessible for users without organizations', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('onboarding.welcome'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('onboarding')
    );
});

test('authenticated users can create an organization', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post(route('organization.store'), [
        'name' => 'New Organization',
        'parent_id' => 'none',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('organizations', [
        'name' => 'New Organization',
    ]);
});

test('authenticated users can update an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'Old Name', 'user_id' => $user->id]);
    
    $this->actingAs($user);

    $response = $this->put(route('organization.update', $organization), [
        'name' => 'Updated Name',
        'parent_id' => 'none',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('organizations', [
        'id' => $organization->id,
        'name' => 'Updated Name',
        'user_id' => $user->id,
    ]);
});

test('authenticated users can delete an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'To Delete', 'user_id' => $user->id]);
    
    $this->actingAs($user);

    $response = $this->delete(route('organization.destroy', $organization));

    $response->assertRedirect();
    $this->assertSoftDeleted($organization);
});

test('authenticated users can restore an organization', function () {
    $user = User::factory()->create();
    $organization = Organization::create(['name' => 'To Restore', 'user_id' => $user->id]);
    $organization->delete();
    
    $this->actingAs($user);

    $response = $this->post(route('organization.restore', $organization->id));

    $response->assertRedirect();
    $this->assertDatabaseHas('organizations', [
        'id' => $organization->id,
        'deleted_at' => null,
    ]);
});

test('authenticated users can create a parent organization for an existing one', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $existingOrg = Organization::create(['name' => 'Existing Org', 'user_id' => $user->id]);

    $response = $this->post(route('organization.store'), [
        'name' => 'New Parent Org',
        'parent_id' => 'none',
        'subsidiary_id' => $existingOrg->id,
    ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('organizations', [
        'name' => 'New Parent Org',
        'parent_id' => null,
        'user_id' => $user->id,
    ]);

    $newParent = Organization::where('name', 'New Parent Org')->first();
    
    $this->assertDatabaseHas('organizations', [
        'id' => $existingOrg->id,
        'parent_id' => $newParent->id,
    ]);
});
