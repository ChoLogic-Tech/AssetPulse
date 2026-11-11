<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\RoleController;

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
Route::middleware(['auth'])->group(function () {
    
    // Dashboard Route
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

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
        Route::get('/itemmaster', function () {
            return Inertia::render('MasterData/ItemMaster');
        })->name('itemmaster');

        // Asset Units
        Route::get('/asset-units', function () {
            return Inertia::render('MasterData/AssetUnits');
        })->name('asset-units');

        // Categories (Main focus for your active link requirement)
        Route::get('/categories', function () {
            return Inertia::render('MasterData/Categories', [
                // Pass database models/data here when ready, e.g.:
                // 'categories' => \App\Models\Category::all()
            ]);
        })->name('categories');

        // Brands
        Route::get('/brands', function () {
            return Inertia::render('MasterData/Brands');
        })->name('brands');

        // Models
        Route::get('/models', function () {
            return Inertia::render('MasterData/Models');
        })->name('models');

        // Vendors & Suppliers
        Route::get('/vendors', function () {
            return Inertia::render('MasterData/Vendors');
        })->name('vendors');
    });

    // ==========================================
    // AUDIT TRAIL & SETTINGS ROUTES
    // ==========================================
    Route::get('/audit-trail', function () {
        return Inertia::render('AuditTrail/Index');
    })->name('audit-trail');

    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/users', function () {
            return Inertia::render('Settings/Users');
        })->name('users');

        Route::get('/rolesandpermissions', [RoleController::class, 'index'])->name('roles.index');

        Route::get('/properties', function () {
            return Inertia::render('Settings/Properties');
        })->name('properties');
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
    // Role
    Route::prefix('roles')->name('roles.')->group(function () {
    Route::get('/', [RoleController::class, 'index'])->name('index');
    Route::post('/', [RoleController::class, 'store'])->name('store'); // <-- Must be defined here
    Route::put('/{role}', [RoleController::class, 'update'])->name('update');
    Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
});
});