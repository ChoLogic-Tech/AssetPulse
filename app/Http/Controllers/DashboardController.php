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
    public function index()
    {
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

        $warehouseCount = DB::table('asset_units')
            ->whereNull('property_id')
            ->count();

        $propertyDistribution->push((object) [
            'id'     => 'warehouse',
            'name'   => 'Central Warehouse',
            'assets' => $warehouseCount,
        ]);

        // Pull central warehouse stock + par levels from main_inventory (not property_inventory)
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

        // Count items at or below par so the top metric card matches the table
        $lowStockItems = DB::table('main_inventory')
            ->whereColumn('qty', '<=', 'parstock')
            ->count();

        // Lookup maps so old audit rows with raw IDs still show readable names
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

                // Swap item_id=<n> with item name when present in older log rows
                $desc = preg_replace_callback('/\bitem_id=(\d+)/i', function ($m) use ($itemNames) {
                    $name = $itemNames[$m[1]] ?? null;
                    return $name ? "Item: {$name}" : "Item #{$m[1]}";
                }, $desc);

                // Swap property_id=<n> with property name when present in older log rows
                $desc = preg_replace_callback('/\bproperty_id=(\d+)/i', function ($m) use ($propertyNames) {
                    $name = $propertyNames[$m[1]] ?? null;
                    return $name ? "Property: {$name}" : "Property #{$m[1]}";
                }, $desc);

                // Clean up older property_id=NULL text and trailing actor tags
                $desc = preg_replace('/\bproperty_id=NULL\s*\(([^)]+)\)/i', '$1', $desc);
                $desc = preg_replace('/\bproperty_id=NULL\b/i', 'Central Warehouse', $desc);
                $desc = preg_replace('/\s*[—-]+\s*by\s+.*?\(#\d+\)\s*$/i', '', $desc);
                $desc = str_replace(['rf_number=', 'qty='], ['RF #', 'Qty: '], $desc);

                // Collapse accidental double "RF #RF-" in older or raw descriptions
                $desc = preg_replace('/\bRF\s*#\s*RF[-#\s]*/i', 'RF #', $desc);

                $log->description = trim($desc);
                return $log;
            });

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'totalAssets'          => AssetUnits::count(),
                'pendingRequests'      => 7, // matched plural key
                'totalMasterlist'      => ItemMasterlist::count(),
                'categoriesCount'      => Category::count(),
                'brandsCount'          => Brand::count(),
                'suppliersCount'       => Supplier::count(),
                'parStock'             => $parStock,
                'lowStockItems'        => $lowStockItems,
                'assetUnits'           => $assetUnits,
                'propertyDistribution' => $propertyDistribution,
                'auditLogs'            => $auditLogs,
            ],
        ]);
    }
}