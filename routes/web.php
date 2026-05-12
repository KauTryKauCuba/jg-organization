<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\OrganizationInvitationController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\RolePermissionController;

Route::get('/', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = true;
    } catch (\Exception $e) {
        $dbStatus = false;
    }

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'dbStatus' => $dbStatus,
    ]);
})->name('home');

Route::get('/debug-session', function () {
    return [
        'secure' => request()->secure(),
        'ip' => request()->ip(),
        'session_id' => session()->getId(),
        'cookies' => request()->cookies->all(),
        'config_session_domain' => config('session.domain'),
        'config_session_secure' => config('session.secure'),
        'app_url' => config('app.url'),
    ];
});

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified', 'ensure.organization'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('organization/invitation/accept', [OrganizationInvitationController::class, 'viewLink'])->name('organization.invitation.viewLink');
    Route::post('organization/invitation/accept', [OrganizationInvitationController::class, 'acceptLink'])->name('organization.invitation.acceptLink');
});

Route::middleware(['auth', 'verified', 'ensure.organization'])->group(function () {
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
});

Route::get('onboarding', function () {
    return Inertia::render('onboarding');
})->middleware(['auth', 'verified'])->name('onboarding.welcome');

Route::middleware(['auth', 'verified', 'ensure.organization'])->group(function () {
    Route::get('organization', [OrganizationController::class, 'index'])->name('organization');
    Route::put('organization/{organization}', [OrganizationController::class, 'update'])->name('organization.update');
    Route::delete('organization/{organization}', [OrganizationController::class, 'destroy'])->name('organization.destroy');
    Route::post('organization/{organization}/restore', [OrganizationController::class, 'restore'])->name('organization.restore');

    // Organization Invitations
    Route::post('organization/invitation', [OrganizationInvitationController::class, 'store'])->name('organization.invitation.store');
    Route::post('organization/invitation/link', [OrganizationInvitationController::class, 'createLink'])->name('organization.invitation.link');
    Route::put('organization/invitation/{invitation}', [OrganizationInvitationController::class, 'update'])->name('organization.invitation.update');
    Route::delete('organization/invitation/{invitation}', [OrganizationInvitationController::class, 'destroy'])->name('organization.invitation.destroy');
    
    Route::get('employee', [EmployeeController::class, 'index'])->name('employee');
    Route::post('employee', [EmployeeController::class, 'store'])->name('employee.store');
    Route::put('employee/{employee}', [EmployeeController::class, 'update'])->name('employee.update');
    Route::delete('employee/{employee}', [EmployeeController::class, 'destroy'])->name('employee.destroy');
    Route::post('employee/{employee}/restore', [EmployeeController::class, 'restore'])->name('employee.restore');

    Route::get('permissions', [RolePermissionController::class, 'index'])->name('permissions');
    Route::post('roles', [RolePermissionController::class, 'storeRole'])->name('roles.store');
    Route::put('roles/{role}', [RolePermissionController::class, 'updateRole'])->name('roles.update');
    Route::delete('roles/{role}', [RolePermissionController::class, 'destroyRole'])->name('roles.destroy');
});

// Organization store route must be accessible during onboarding
Route::post('organization', [OrganizationController::class, 'store'])->middleware(['auth', 'verified'])->name('organization.store');

require __DIR__.'/settings.php';
