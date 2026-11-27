<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PropertyInventoryController extends Controller
{
    // Load property stock rows, base parstock values, filter dropdowns, and serial counts
    public function index()
    {
        // Join property_inventory with masterlist, UOM, category, brand, model, and stock-in totals
        $propertyInventory = DB::table('property_inventory as pi')
            ->join('properties as prop', 'pi.property_id', '=', 'prop.id')
            ->join('item_masterlist as im', 'pi.item_id', '=', 'im.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->leftJoin('categories as c', 'im.category_id', '=', 'c.id')
            ->leftJoin('brands as b', 'im.brand_id', '=', 'b.id')
            ->leftJoin('models as m', 'im.model_id', '=', 'm.id')
            // Sum stock-in quantities for the matching property and item
            ->leftJoin('stock_in_logs as sil', function ($join) {
                $join->on('sil.property_id', '=', 'pi.property_id')
                    ->on('sil.item_id', '=', 'pi.item_id');
            })
            ->select([
                'pi.id',
                'pi.property_id',
                'pi.item_id',
                'pi.qty',
                'pi.parstock',
                'pi.rf_num',
                'pi.previous_rf_num',
                'pi.last_updated',
                'prop.name as property_name',
                'im.item_name',
                'im.category_id',
                'im.uom_id',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
                DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
                'u.code as uom_code',
                DB::raw("COALESCE(c.name, 'Uncategorized') as category_name"),
                'b.name as brand_name',
                'm.name as model_name',
                DB::raw('COALESCE(SUM(sil.quantity), 0) as stockin'),
            ])
            ->groupBy([
                'pi.id',
                'pi.property_id',
                'pi.item_id',
                'pi.qty',
                'pi.parstock',
                'pi.rf_num',
                'pi.previous_rf_num',
                'pi.last_updated',
                'prop.name',
                'im.item_name',
                'im.category_id',
                'im.uom_id',
                's.sku_code',
                'u.name',
                'u.code',
                'c.name',
                'b.name',
                'm.name',
            ])
            ->orderBy('prop.name')
            ->orderBy('im.item_name')
            ->get();

        // Fetch properties and categories for the filter dropdowns
        $properties = DB::table('properties')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $categories = DB::table('categories')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Count serialized units per property + item pair and key by "propertyId_itemId"
        $serializedCounts = DB::table('asset_units')
            ->whereNotNull('property_id')
            ->select([
                'property_id',
                'item_id',
                DB::raw('COUNT(*) as serialized_count'),
            ])
            ->groupBy('property_id', 'item_id')
            ->get()
            ->keyBy(fn ($row) => "{$row->property_id}_{$row->item_id}");

        // Attach serialized_count and normalize parstock to an integer on each row
        $enrichedInventory = $propertyInventory->map(function ($row) use ($serializedCounts) {
            $key = "{$row->property_id}_{$row->item_id}";
            $row->serialized_count = (int) ($serializedCounts->get($key)?->serialized_count ?? 0);
            $row->parstock = (int) ($row->parstock ?? 0);
            return $row;
        });

        // Point to the nested PropertyInventory.jsx view inside Pages/Inventory/Property/
        return Inertia::render('Inventory/Property/PropertyInventory', [
            'propertyInventory' => $enrichedInventory,
            'properties' => $properties,
            'categories' => $categories,
        ]);
    }

    // Save an updated base parstock value for a property_inventory record
    public function updateParstock(Request $request, int $propertyInventoryId)
    {
        // Validate non-negative integer parstock
        $validated = $request->validate([
            'parstock' => ['required', 'integer', 'min:0'],
        ]);

        // Update parstock and timestamp in PostgreSQL
        DB::table('property_inventory')
            ->where('id', $propertyInventoryId)
            ->update([
                'parstock' => (int) $validated['parstock'],
                'last_updated' => now(),
            ]);

        return back()->with('success', 'Property parstock updated.');
    }
}