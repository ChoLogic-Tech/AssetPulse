<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ModelController;
use App\Http\Controllers\PropertyController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ItemMasterController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SkuController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UomController;

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
        Route::get('/warehouse', function () {
            return Inertia::render('Inventory/Warehouse'); // Points to resources/js/Pages/Inventory/Warehouse.jsx
        })->name('warehouse');

        Route::get('/warehousestockin', function () {
            return Inertia::render('Inventory/WarehouseStockIn'); // Points to resources/js/Pages/Inventory/WarehouseStockIn.jsx
        })->name('warehousestockin');

        Route::get ('/propertyinventory', function () {
            return Inertia::render('Inventory/PropertyInventory'); // Points to resources/js/Pages/Inventory/PropertyInventory.jsx
        })->name('propertyinventory');

        Route::get('/propertystockin', function () {
            return Inertia::render('Inventory/PropertyStockIn'); // Points to resources/js/Pages/Inventory/PropertyStockIn.jsx
        })->name('propertystockin');
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
        
        // Item Masterlists
        Route::get('/itemmaster', [ItemMasterController::class, 'index'])->name('item_masterlist.index');


        // Asset Units
        Route::get('/asset-units', function () {
            return Inertia::render('MasterData/AssetUnits');
        })->name('asset-units');

        // SKUs
        Route::get('/skus', [SkuController::class, 'index'])->name('skus.index');

        // Unit of Measures
        Route::get('/unitofmeasures', [UomController::class, 'index'])->name('unitofmeasures.index');

        // Categories
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');

        // Brands
        Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');

        // Models
        Route::get('/models', [ModelController::class, 'index'])->name('models.index');

        // Vendors & Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');

        // Locations
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
    // Logout Route
    Route::post('/logout', function (Request $request) {
        Auth::logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    })->name('logout');

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // User
    Route::prefix('users')->name('users.')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::post('/', [UserController::class, 'store'])->name('store'); // <-- Must be defined here
    Route::put('/{user}', [UserController::class, 'update'])->name('update');
    Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
});

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Role
    Route::prefix('roles')->name('roles.')->group(function () {
    Route::get('/', [RoleController::class, 'index'])->name('index');
    Route::post('/', [RoleController::class, 'store'])->name('store');
    Route::put('/{role}', [RoleController::class, 'update'])->name('update');
    Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // SKUs
    Route::prefix('skus')->name('skus.')->group(function () {
    Route::get('/', [SkuController::class, 'index'])->name('index');
    Route::post('/', [SkuController::class, 'store'])->name('store');
    Route::put('/{sku}', [SkuController::class, 'update'])->name('update');
    Route::delete('/{sku}', [SkuController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Unit of Measures
    Route::prefix('unitofmeasures')->name('unitofmeasures.')->group(function () {
    Route::get('/', [UomController::class, 'index'])->name('index');
    Route::post('/', [UomController::class, 'store'])->name('store');
    Route::put('/{unitofmeasure}', [UomController::class, 'update'])->name('update');
    Route::delete('/{unitofmeasure}', [UomController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Category
    Route::prefix('categories')->name('categories.')->group(function () {
    Route::get('/', [CategoryController::class, 'index'])->name('index');
    Route::post('/', [CategoryController::class, 'store'])->name('store');
    Route::put('/{category}', [CategoryController::class, 'update'])->name('update');
    Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Brand
    Route::prefix('brands')->name('brands.')->group(function () {
    Route::get('/', [BrandController::class, 'index'])->name('index');
    Route::post('/', [BrandController::class, 'store'])->name('store');
    Route::put('/{brand}', [BrandController::class, 'update'])->name('update');
    Route::delete('/{brand}', [BrandController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Models
    Route::prefix('models')->name('models.')->group(function () {
    Route::get('/', [ModelController::class, 'index'])->name('index');
    Route::post('/', [ModelController::class, 'store'])->name('store');
    Route::put('/{model}', [ModelController::class, 'update'])->name('update');
    Route::delete('/{model}', [ModelController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Suppliers
    Route::prefix('suppliers')->name('suppliers.')->group(function () {
    Route::get('/', [SupplierController::class, 'index'])->name('index');
    Route::post('/', [SupplierController::class, 'store'])->name('store');
    Route::put('/{suppliers}', [SupplierController::class, 'update'])->name('update');
    Route::delete('/{suppliers}', [SupplierController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Locations
    Route::prefix('locations')->name('locations.')->group(function () {
    Route::get('/', [LocationController::class, 'index'])->name('index');
    Route::post('/', [LocationController::class, 'store'])->name('store');
    Route::put('/{locations}', [LocationController::class, 'update'])->name('update');
    Route::delete('/{locations}', [LocationController::class, 'destroy'])->name('destroy');
    });

    // ==========================================
    // INSERT DATA IN DATABASE MANAGEMENT
    // ==========================================
    // Item Masterlist
    Route::prefix('itemmaster')->name('itemmaster.')->group(function () {
    Route::get('/', [ItemMasterController::class, 'index'])->name('index');
    Route::post('/', [ItemMasterController::class, 'store'])->name('store');
    Route::put('/{itemmaster}', [ItemMasterController::class, 'update'])->name('update');
    Route::delete('/{itemmaster}', [ItemMasterController::class, 'destroy'])->name('destroy');
    });
});