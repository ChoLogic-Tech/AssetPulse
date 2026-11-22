<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\ItemMasterlist;
use App\Models\Supplier;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'dashboard' => [
                'totalAssets'     => 485,
                'pendingRequests' => 7, // matched plural key
                'totalMasterlist' => ItemMasterlist::count(),
                'categoriesCount' => Category::count(),
                'brandsCount'     => Brand::count(),
                'suppliersCount'  => Supplier::count(),
                'lowStockItems'   => 3,
            ],
        ]);
    }
}