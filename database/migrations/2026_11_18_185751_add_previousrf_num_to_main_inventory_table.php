<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Case-insensitive unique index on supplier name (e.g., blocks both 'Delsan' and 'delsan')
        DB::statement('CREATE UNIQUE INDEX suppliers_name_lower_unique ON suppliers (LOWER(TRIM(name)))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS suppliers_name_lower_unique');
    }
};