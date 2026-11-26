<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only run renameColumn if po_number still exists and rf_number does not
        if (Schema::hasColumn('stock_in_logs', 'po_number') && !Schema::hasColumn('stock_in_logs', 'rf_number')) {
            Schema::table('stock_in_logs', function (Blueprint $table) {
                $table->renameColumn('po_number', 'rf_number');
            });
        }

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION public.fn_process_stock_in()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF NEW.property_id IS NULL THEN
                    -- Central Warehouse Stock-in
                    INSERT INTO public.main_inventory (previous_rf_num, rf_num, item_id, stockin, qty, last_updated)
                    VALUES (NULL, NEW.rf_number, NEW.item_id, NEW.quantity, NEW.quantity, CURRENT_TIMESTAMP)
                    ON CONFLICT (item_id)
                    DO UPDATE SET
                        previous_rf_num = public.main_inventory.rf_num,
                        rf_num = EXCLUDED.rf_num,
                        stockin = public.main_inventory.stockin + EXCLUDED.stockin,
                        qty = public.main_inventory.qty + EXCLUDED.qty,
                        last_updated = CURRENT_TIMESTAMP;
                ELSE
                    -- Property Inventory Stock-in
                    INSERT INTO public.property_inventory (property_id, item_id, qty)
                    VALUES (NEW.property_id, NEW.item_id, NEW.quantity)
                    ON CONFLICT (property_id, item_id)
                    DO UPDATE SET
                        qty = public.property_inventory.qty + EXCLUDED.qty;
                END IF;

                RETURN NEW;
            END;
            $$;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION public.fn_process_stock_in()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF NEW.property_id IS NULL THEN
                    INSERT INTO public.main_inventory (previous_rf_num, rf_num, item_id, stockin, qty, last_updated)
                    VALUES (NULL, NEW.po_number, NEW.item_id, NEW.quantity, NEW.quantity, CURRENT_TIMESTAMP)
                    ON CONFLICT (item_id)
                    DO UPDATE SET
                        previous_rf_num = public.main_inventory.rf_num,
                        rf_num = EXCLUDED.rf_num,
                        stockin = public.main_inventory.stockin + EXCLUDED.stockin,
                        qty = public.main_inventory.qty + EXCLUDED.qty,
                        last_updated = CURRENT_TIMESTAMP;
                ELSE
                    INSERT INTO public.property_inventory (property_id, item_id, qty)
                    VALUES (NEW.property_id, NEW.item_id, NEW.quantity)
                    ON CONFLICT (property_id, item_id)
                    DO UPDATE SET
                        qty = public.property_inventory.qty + EXCLUDED.qty;
                END IF;

                RETURN NEW;
            END;
            $$;
        SQL);

        if (Schema::hasColumn('stock_in_logs', 'rf_number') && !Schema::hasColumn('stock_in_logs', 'po_number')) {
            Schema::table('stock_in_logs', function (Blueprint $table) {
                $table->renameColumn('rf_number', 'po_number');
            });
        }
    }
};