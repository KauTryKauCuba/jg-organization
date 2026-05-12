<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_status_check");
            DB::statement("ALTER TABLE organization_invitations ADD CONSTRAINT organization_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed'))");
        } else {
            DB::statement("ALTER TABLE organization_invitations MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'confirmed') NOT NULL DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_status_check");
            DB::statement("ALTER TABLE organization_invitations ADD CONSTRAINT organization_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined'))");
        } else {
            DB::statement("ALTER TABLE organization_invitations MODIFY COLUMN status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending'");
        }
    }
};
