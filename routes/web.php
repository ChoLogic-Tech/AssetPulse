<?php

use App\Http\Controllers\AssetUnitController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemMasterController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ModelController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PropertyStockInController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SkuController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UomController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WarehouseStockInController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Root redirect based on auth status
Route::get('/', function () {
    return Auth::check() ? redirect()->route('dashboard') : redirect()->route('login');
});

// Routes for guests only (If logged in, Laravel automatically redirects to dashboard)
Route::middleware('guest')->group(function () {
    // Show the login page (GET)
    Route::get('/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');

    // Handle the login submission (POST)
    Route::post('/login', function (Request $request) {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $fieldType = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        if (Auth::attempt([$fieldType => $credentials['login'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            $request->session()->regenerate();
            return Inertia::location(route('dashboard'));
        }

        return back()->withErrors([
            'login' => 'The provided credentials do not match our records.',
        ]);
    });
});

// 4. Protected Routes (Requires Authentication & Session Validation)
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard Route
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ==========================================
    // INVENTORY MODULE ROUTES
    // ==========================================
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/warehouse', [WarehouseController::class, 'index'])->name('warehouse');

        Route::get('/warehousestockin', [WarehouseStockInController::class, 'index'])
            ->name('warehousestockin.index');

        Route::get('/propertyinventory', function () {
            return Inertia::render('Inventory/PropertyInventory');
        })->name('propertyinventory');

        Route::get('/propertystockin', [PropertyStockInController::class, 'index'])
            ->name('propertystockin.index');
    });

    // ==========================================
    // REQUISITIONS ROUTES
    // ==========================================
    Route::prefix('requisitions')->name('requisitions.')->group(function () {
        Route::get('/index', function () {
            return Inertia::render('Requisitions/Index');
        })->name('index');

        Route::get('/show', function () {
            return Inertia::render('Requisitions/Show');
        })->name('show');

        Route::get('/create', function () {
            return Inertia::render('Requisitions/Create');
        })->name('create');
    });

    // ==========================================
    // REPORTS ROUTES
    // ==========================================
    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');

    // ==========================================
    // MASTER DATA MODULE ROUTES (Sidebar Group)
    // ==========================================
    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/itemmaster', [ItemMasterController::class, 'index'])->name('item_masterlist.index');
        Route::get('/assetunits', [AssetUnitController::class, 'index'])->name('assetunits.index');
        Route::get('/skus', [SkuController::class, 'index'])->name('skus.index');
        Route::get('/unitofmeasures', [UomController::class, 'index'])->name('unitofmeasures.index');
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');
        Route::get('/models', [ModelController::class, 'index'])->name('models.index');
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');
    });

    // ==========================================
    // AUDIT TRAIL & SETTINGS ROUTES
    // ==========================================
    Route::get('/audit-trail', function () {
        return Inertia::render('AuditTrail/Index');
    })->name('audit-trail');

    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/rolesandpermissions', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/properties', [PropertyController::class, 'index'])->name('properties.index');
    });

    // ==========================================
    // AUTHENTICATION MANAGEMENT
    // ==========================================
    Route::post('/logout', function (Request $request) {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    })->name('logout');

    // ==========================================
    // MUTATION / RESOURCE ROUTES
    // ==========================================
    Route::prefix('warehouseparstocks')->name('warehouseparstocks.')->group(function () {
    Route::put('/{mainInventoryId}', [WarehouseController::class, 'updateParstock'])->name('update');
    });

    Route::prefix('warehousestockins')->name('warehousestockins.')->group(function () {
        Route::post('/', [WarehouseStockInController::class, 'store'])->name('store');
        Route::put('/{warehousestockin}', [WarehouseStockInController::class, 'update'])->name('update');
        Route::delete('/{warehousestockin}', [WarehouseStockInController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('propertystockins')->name('propertystockins.')->group(function () {
        Route::post('/', [PropertyStockInController::class, 'store'])->name('store');
        Route::put('/{propertystockin}', [PropertyStockInController::class, 'update'])->name('update');
        Route::delete('/{propertystockin}', [PropertyStockInController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('users')->name('users.')->group(function () {
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('roles')->name('roles.')->group(function () {
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::put('/{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('assetunits')->name('assetunits.')->group(function () {
        Route::get('/', [AssetUnitController::class, 'index'])->name('index');
        Route::post('/', [AssetUnitController::class, 'store'])->name('store');
        Route::put('/{assetunit}', [AssetUnitController::class, 'update'])->name('update');
        Route::delete('/{assetunit}', [AssetUnitController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('skus')->name('skus.')->group(function () {
        Route::post('/', [SkuController::class, 'store'])->name('store');
        Route::put('/{sku}', [SkuController::class, 'update'])->name('update');
        Route::delete('/{sku}', [SkuController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('unitofmeasures')->name('unitofmeasures.')->group(function () {
        Route::post('/', [UomController::class, 'store'])->name('store');
        Route::put('/{unitofmeasure}', [UomController::class, 'update'])->name('update');
        Route::delete('/{unitofmeasure}', [UomController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('categories')->name('categories.')->group(function () {
        Route::post('/', [CategoryController::class, 'store'])->name('store');
        Route::put('/{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('brands')->name('brands.')->group(function () {
        Route::post('/', [BrandController::class, 'store'])->name('store');
        Route::put('/{brand}', [BrandController::class, 'update'])->name('update');
        Route::delete('/{brand}', [BrandController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('models')->name('models.')->group(function () {
        Route::post('/', [ModelController::class, 'store'])->name('store');
        Route::put('/{model}', [ModelController::class, 'update'])->name('update');
        Route::delete('/{model}', [ModelController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('suppliers')->name('suppliers.')->group(function () {
        Route::post('/', [SupplierController::class, 'store'])->name('store');
        Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update');
        Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('locations')->name('locations.')->group(function () {
        Route::post('/', [LocationController::class, 'store'])->name('store');
        Route::put('/{location}', [LocationController::class, 'update'])->name('update');
        Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('itemmaster')->name('itemmaster.')->group(function () {
        Route::post('/', [ItemMasterController::class, 'store'])->name('store');
        Route::put('/{itemmaster}', [ItemMasterController::class, 'update'])->name('update');
        Route::delete('/{itemmaster}', [ItemMasterController::class, 'destroy'])->name('destroy');
    });
});