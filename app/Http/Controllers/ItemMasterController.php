<?php

namespace App\Http\Controllers;

use App\Models\ItemMasterlist;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Models;
use App\Models\Sku;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ItemMasterController extends Controller
{
    public function index()
    {   
        $item = ItemMasterlist::with('brand', 'model', 'category', 'sku')->orderBy('item_name', 'ASC')->get();

        return Inertia::render('MasterData/ItemMaster', [
            'item' => $item,
            'skus' => Sku::orderBy('sku_code', 'ASC')->get(),
            'categories' => Category::orderBy('name', 'ASC')->get(),
            'brands' => Brand::orderBy('name', 'ASC')->get(),
            'models' => Models::orderBy('name', 'ASC')->get(),
        ]);
    }

    public function store(Request $request) 
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:255',
            'item_name' => 'required|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'uom' => 'required|string|max:50',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        ItemMasterlist::create($validated);

        return redirect()->back()->with('success', 'Item successfully created.');
    }

    // Changed $itemMasterlist to $itemmaster to match web.php route parameter
    public function update(Request $request, ItemMasterlist $itemmaster) 
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:255',
            'item_name' => 'required|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'uom' => 'required|string|max:50',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        $itemmaster->update($validated);

        return redirect()->back()->with('success', 'Item successfully updated.');
    }

    // Changed $itemMasterlist to $itemmaster to match web.php route parameter
    public function destroy(ItemMasterlist $itemmaster) 
{
    // Check if the item has stock logs or active inventory records
    $hasStockIn = DB::table('stock_in_logs')->where('item_id', $itemmaster->id)->exists();
    $mainInventory = DB::table('main_inventory')->where('item_id', $itemmaster->id)->first();

    if ($hasStockIn || ($mainInventory && $mainInventory->qty > 0)) {
        return redirect()->back()->withErrors([
            'delete' => 'Cannot delete this item because it has stock-in history or active inventory records.'
        ]);
    }

    // Clean up empty main_inventory row if it exists, then delete the master item
    if ($mainInventory) {
        DB::table('main_inventory')->where('item_id', $itemmaster->id)->delete();
    }
    
    $itemmaster->delete();

    return redirect()->back()->with('success', 'Item successfully deleted.');
}
}