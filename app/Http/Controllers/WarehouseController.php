<?php

namespace App\Http\Controllers;

use App\Models\MainInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WarehouseController extends Controller
{
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

        return Inertia::render('Inventory/Warehouse', [
            'mainInventory' => $mainInventory,
            'categories' => $categories,
        ]);
    }

    public function updateParstock(Request $request, int $mainInventoryId)
{
    // dd($mainInventoryId, $request->all());

    $validated = $request->validate([
        'parstock' => ['required', 'integer', 'min:0'],
    ]);

    $updated = DB::table('main_inventory')
        ->where('id', $mainInventoryId)
        ->update([
            'parstock' => (int) $validated['parstock'],
            'last_updated' => now(),
        ]);

    abort_unless($updated > 0, 404);

    return back();
}
}