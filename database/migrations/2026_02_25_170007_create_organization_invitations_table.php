<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_org_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('receiver_org_id')->constrained('organizations')->onDelete('cascade');
            $table->enum('type', ['parent', 'subsidiary']); // 'parent' means sender wants receiver to be parent. 'subsidiary' means sender wants receiver to be subsidiary.
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
    }
};
