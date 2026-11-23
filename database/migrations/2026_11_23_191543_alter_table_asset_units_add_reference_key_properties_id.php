<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE public.asset_units
            ADD CONSTRAINT asset_units_property_fkey
            FOREIGN KEY (property_id) REFERENCES public.properties(id)
            ON DELETE SET NULL
        ");

        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS asset_units_serial_lower_unique
            ON public.asset_units (LOWER(TRIM(serial_number)))
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE public.asset_units
            DROP CONSTRAINT IF EXISTS asset_units_property_fkey
        ");

        DB::statement("
            DROP INDEX IF EXISTS public.asset_units_serial_lower_unique
        ");
    }
};