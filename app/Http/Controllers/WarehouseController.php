<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    // Load central warehouse inventory and categories for the Warehouse page
    public function index()
    {
        $mainInventory = DB::table('main_inventory as mi')
            ->join('item_masterlist as im', 'mi.item_id', '=', 'im.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->select([
                'mi.id',
                'mi.item_id',
                'im.category_id',
                'mi.rf_num',
                'mi.previous_rf_num',
                'mi.stockin',
                'mi.stockout',
                'mi.qty',
                'mi.parstock',
                'im.item_name',
                'im.uom_id',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
                DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
            ])
            ->orderBy('im.item_name')
            ->get();

        $categories = DB::table('categories')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Point to the nested Warehouse.jsx view inside Pages/Inventory/Warehouse/
        return Inertia::render('Inventory/Warehouse/Warehouse', [
            'mainInventory' => $mainInventory,
            'categories' => $categories,
        ]);
    }

    // Update baseline par stock for a warehouse item and record an audit log entry
    public function updateParstock(Request $request, int $mainInventoryId)
    {
        $validated = $request->validate([
            'parstock' => ['required', 'integer', 'min:0'],
        ]);

        $nextPar = (int) $validated['parstock'];

        DB::transaction(function () use ($mainInventoryId, $nextPar) {
            // Lock only main_inventory first (PostgreSQL blocks FOR UPDATE with LEFT JOIN)
            $inventoryRow = DB::table('main_inventory')
                ->where('id', $mainInventoryId)
                ->lockForUpdate()
                ->first();

            abort_unless($inventoryRow !== null, 404);

            // Fetch item name and UOM separately after locking the inventory row
            $itemMeta = DB::table('item_masterlist as im')
                ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
                ->where('im.id', $inventoryRow->item_id)
                ->select([
                    'im.item_name',
                    DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
                    'u.code as uom_code',
                ])
                ->first();

            $oldPar = (int) ($inventoryRow->parstock ?? 0);

            // Save the new par stock level and update the timestamp
            DB::table('main_inventory')
                ->where('id', $mainInventoryId)
                ->update([
                    'parstock' => $nextPar,
                    'last_updated' => now(),
                ]);

            $itemName = $itemMeta->item_name ?? "Item #{$inventoryRow->item_id}";
            $uomLabel = $itemMeta->uom_name ?: ($itemMeta->uom_code ?: 'Unit');
            $oldParText = $this->formatCountWithUom($oldPar, $uomLabel);
            $nextParText = $this->formatCountWithUom($nextPar, $uomLabel);

            // Treat going from 0 to a positive number as setting initial par stock
            $isInitialSet = $oldPar === 0 && $nextPar > 0;
            $actionType = $isInitialSet ? 'PARSTOCK_CREATE' : 'PARSTOCK_UPDATE';

            // Build a readable audit log description with the table ID
            $description = $isInitialSet
                ? sprintf(
                    'Set baseline par stock for %s at Central Warehouse to %s (Main inventory table #%d)',
                    $itemName,
                    $nextParText,
                    $mainInventoryId
                )
                : sprintf(
                    'Updated baseline par stock for %s at Central Warehouse: %s -> %s (Main inventory table #%d)',
                    $itemName,
                    $oldParText,
                    $nextParText,
                    $mainInventoryId
                );

            // Insert the audit log for the currently authenticated user
            $user = Auth::user();
            if ($user) {
                DB::table('audit_logs')->insert([
                    'user_id' => $user->id,
                    'action_type' => $actionType,
                    'table_name' => 'main_inventory',
                    'record_id' => $mainInventoryId,
                    'description' => $description,
                ]);
            }
        });

        return back();
    }

    // Pluralize and format a stock or par count with its UOM label
    private function formatCountWithUom(int $count, string $baseUom): string
    {
        $clean = trim($baseUom) !== '' ? trim($baseUom) : 'Unit';
        $isAllUpper = $clean === strtoupper($clean) && preg_match('/[A-Z]/', $clean);
        $lower = strtolower($clean);

        if (abs($count) === 1) {
            $label = $clean;
        } elseif (
            str_ends_with($lower, 's')
            && !str_ends_with($lower, 'ss')
            && !in_array($lower, ['box', 'pcs'], true)
        ) {
            $label = $clean;
        } elseif (preg_match('/(x|z|ch|sh|ss)$/', $lower)) {
            $label = $isAllUpper ? $clean . 'ES' : $clean . 'es';
        } elseif (str_ends_with($lower, 'ce')) {
            $label = $isAllUpper ? $clean . 'S' : $clean . 's';
        } else {
            $label = $isAllUpper ? $clean . 'S' : $clean . 's';
        }

        return number_format($count) . ' ' . $label;
    }
}