<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rename the existing 'status' column to 'user_status'
            if (Schema::hasColumn('users', 'status') && !Schema::hasColumn('users', 'user_status')) {
                $table->renameColumn('status', 'user_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'user_status')) {
                $table->renameColumn('user_status', 'status');
            }
        });
    }
};