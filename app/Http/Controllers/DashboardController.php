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
        
        

        return Inertia::render('Dashboard', [
            'dashboard' => [
                'totalAssets'          => AssetUnits::count(),
                'pendingRequests'      => 7, // matched plural key
                'totalMasterlist'      => ItemMasterlist::count(),
                'categoriesCount'      => Category::count(),
                'brandsCount'          => Brand::count(),
                'suppliersCount'       => Supplier::count(),
                'lowStockItems'        => 3,
                'assetUnits'           => $assetUnits,
                'propertyDistribution' => $propertyDistribution,
            ],
        ]);
    }
}