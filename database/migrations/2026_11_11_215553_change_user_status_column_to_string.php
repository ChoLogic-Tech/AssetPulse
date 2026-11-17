<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop the old foreign key constraint if it exists
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS user_status_fkey");
        
        // (Optional: Just in case Laravel named it with table prefix)
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_status_foreign");

        // 2. Change the column type from integer to VARCHAR and map values
        DB::statement("
            ALTER TABLE users 
            ALTER COLUMN user_status TYPE VARCHAR(50) 
            USING CASE 
                WHEN user_status::text = '1' THEN 'Active'
                ELSE 'Inactive'
            END
        ");

        // 3. Set a default string value for new records
        DB::statement("ALTER TABLE users ALTER COLUMN user_status SET DEFAULT 'Active'");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE users 
            ALTER COLUMN user_status TYPE INTEGER 
            USING CASE 
                WHEN user_status = 'Active' THEN 1
                ELSE 0
            END
        ");
    }
};