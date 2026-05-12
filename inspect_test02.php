<?php
use App\Models\User;
use App\Models\Organization;

$user = User::where('email', 'test02@gmail.com')->first();
if (!$user) {
    echo "User test02@gmail.com not found.\n";
    exit;
}

echo "User ID: {$user->id}\n";

$orgs = Organization::where('user_id', $user->id)->get();
foreach ($orgs as $org) {
    echo "ID: {$org->id}, Name: {$org->name}, Parent ID: {$org->parent_id}\n";
}
