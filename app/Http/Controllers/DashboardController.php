<?php

namespace App\Http\Controllers;

use App\Models\AssetUnits;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ItemMasterlist;
use App\Models\Property;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // Load dashboard metrics, central and property par stock overviews, asset counts, and audit logs
    public function index()
    {
        // Load serialized asset units with item, property, room/location, and supplier labels
        $assetUnits = DB::table('asset_units as au')
            ->leftJoin('item_masterlist as im', 'au.item_id', '=', 'im.id')
            ->leftJoin('properties as p', 'au.property_id', '=', 'p.id')
            ->leftJoin('locations as l', 'au.location_id', '=', 'l.id')
            ->leftJoin('suppliers as s', 'au.supplier_id', '=', 's.id')
            ->select(
                'au.id',
                'au.item_id',
                'au.supplier_id',
                'au.serial_number',
                'au.status',
                'au.property_id',
                'au.location_id',
                'au.date_received',
                'im.item_name',
                'p.name as property_name',
                'l.name as location_name',
                's.name as supplier_name'
            )
            ->orderBy('im.item_name', 'ASC')
            ->orderBy('au.serial_number', 'ASC')
            ->get();

        // Count serialized assets assigned to each property
        $propertyDistribution = Property::query()
            ->leftJoin('asset_units as au', 'properties.id', '=', 'au.property_id')
            ->select(
                'properties.id',
                'properties.name',
                DB::raw('COUNT(au.id) as assets')
            )
            ->groupBy('properties.id', 'properties.name')
            ->orderByDesc('assets')
            ->orderBy('properties.name', 'ASC')
            ->get();

        // Append unassigned (warehouse) serialized units as a "Central Warehouse" entry
        $warehouseCount = DB::table('asset_units')
            ->whereNull('property_id')
            ->count();

        $propertyDistribution->push((object) [
            'id'     => 'warehouse',
            'name'   => 'Central Warehouse',
            'assets' => $warehouseCount,
        ]);

        // Pull central warehouse stock and baseline par levels from main_inventory
        $parStock = DB::table('main_inventory as mi')
            ->join('item_masterlist as im', 'mi.item_id', '=', 'im.id')
            ->leftJoin('categories as c', 'im.category_id', '=', 'c.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->select(
                'mi.id',
                'mi.item_id',
                'mi.rf_num',
                'mi.previous_rf_num',
                's.sku_code as sku',
                'im.item_name as name',
                'c.name as category',
                'mi.stockin',
                'mi.stockout',
                'mi.qty as currentStock',
                'mi.parstock as parLevel',
                'mi.last_updated'
            )
            ->orderBy('im.item_name', 'ASC')
            ->get();

        // Count central warehouse items at or below par (only when parstock > 0 so unset items aren't flagged)
        $lowStockItems = DB::table('main_inventory')
            ->where('parstock', '>', 0)
            ->whereColumn('qty', '<=', 'parstock')
            ->count();

        // Pull property inventory stock and baseline par levels from property_inventory
        $propertyParStock = DB::table('property_inventory as pi')
            ->join('properties as prop', 'pi.property_id', '=', 'prop.id')
            ->join('item_masterlist as im', 'pi.item_id', '=', 'im.id')
            ->leftJoin('categories as c', 'im.category_id', '=', 'c.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->select(
                'pi.id',
                'pi.property_id',
                'pi.item_id',
                'pi.rf_num',
                'pi.previous_rf_num',
                'prop.name as property_name',
                's.sku_code as sku',
                'im.item_name as name',
                'c.name as category',
                'pi.qty as currentStock',
                'pi.parstock as parLevel',
                'pi.last_updated'
            )
            ->orderBy('prop.name', 'ASC')
            ->orderBy('im.item_name', 'ASC')
            ->get();

        // Count property items at or below their configured baseline parstock (parstock > 0)
        $propertyLowStockItems = DB::table('property_inventory')
            ->where('parstock', '>', 0)
            ->whereColumn('qty', '<=', 'parstock')
            ->count();

        // Lookup maps so older audit log entries with raw IDs still display readable names
        $itemNames = DB::table('item_masterlist')->pluck('item_name', 'id');
        $propertyNames = DB::table('properties')->pluck('name', 'id');

        // Pull recent audit trail entries joined with users for readable actor names
        $auditLogs = DB::table('audit_logs as al')
            ->leftJoin('users as u', 'al.user_id', '=', 'u.id')
            ->select(
                'al.id',
                'al.user_id',
                'al.action_type',
                'al.table_name',
                'al.record_id',
                'al.description',
                'al.created_at',
                DB::raw("COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.fname, ''), ' ', COALESCE(u.lname, ''))), ''), u.username, 'System') as user_name")
            )
            ->orderByDesc('al.created_at')
            ->orderByDesc('al.id')
            ->limit(20)
            ->get()
            ->map(function ($log) use ($itemNames, $propertyNames) {
                $desc = $log->description ?? '';

                // Replace item_id=<n> with item name when present in older log text
                $desc = preg_replace_callback('/\bitem_id=(\d+)/i', function ($m) use ($itemNames) {
                    $name = $itemNames[$m[1]] ?? null;
                    return $name ? "Item: {$name}" : "Item #{$m[1]}";
                }, $desc);

                // Replace property_id=<n> with property name when present in older log text
                $desc = preg_replace_callback('/\bproperty_id=(\d+)/i', function ($m) use ($propertyNames) {
                    $name = $propertyNames[$m[1]] ?? null;
                    return $name ? "Property: {$name}" : "Property #{$m[1]}";
                }, $desc);

                // Normalize older property_id=NULL text, trailing actor tags, and RF prefixes
                $desc = preg_replace('/\bproperty_id=NULL\s*\(([^)]+)\)/i', '$1', $desc);
                $desc = preg_replace('/\bproperty_id=NULL\b/i', 'Central Warehouse', $desc);
                $desc = preg_replace('/\s*[—-]+\s*by\s+.*?\(#\d+\)\s*$/i', '', $desc);
                $desc = str_replace(['rf_number=', 'qty='], ['RF #', 'Qty: '], $desc);
                $desc = preg_replace('/\bRF\s*#\s*RF[-#\s]*/i', 'RF #', $desc);

                $log->description = trim($desc);
                return $log;
            });

        // Pass all existing dashboard data plus property parstock metrics and rows to Inertia
        return Inertia::render('Dashboard', [
            'dashboard' => [
                'totalAssets'           => AssetUnits::count(),
                'pendingRequests'       => 7,
                'totalMasterlist'       => ItemMasterlist::count(),
                'categoriesCount'       => Category::count(),
                'brandsCount'           => Brand::count(),
                'suppliersCount'        => Supplier::count(),
                'parStock'              => $parStock,
                'lowStockItems'         => $lowStockItems,
                'propertyParStock'      => $propertyParStock,
                'propertyLowStockItems' => $propertyLowStockItems,
                'assetUnits'            => $assetUnits,
                'propertyDistribution'  => $propertyDistribution,
                'auditLogs'             => $auditLogs,
            ],
        ]);
    }
}