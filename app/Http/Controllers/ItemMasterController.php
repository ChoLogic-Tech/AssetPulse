<?php

namespace App\Http\Controllers;

use App\Models\ItemMasterlist;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Models;
use App\Models\Sku;
use App\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ItemMasterController extends Controller
{
    public function index()
    {
        $item = ItemMasterlist::with('brand', 'model', 'category', 'sku', 'uom')
            ->orderBy('item_name', 'ASC')
            ->get();

        return Inertia::render('MasterData/ItemMaster', [
            'item' => $item,
            'skus' => Sku::orderBy('sku_code', 'ASC')->get(),
            'unitofmeasures' => UnitOfMeasure::orderBy('name', 'ASC')->get(),
            'categories' => Category::orderBy('name', 'ASC')->get(),
            'brands' => Brand::orderBy('name', 'ASC')->get(),
            'models' => Models::orderBy('name', 'ASC')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeRequest($request);

        $validated = $request->validate([
            'sku_id' => 'required|integer|exists:sku,id',
            'uom_id' => 'required|integer|exists:uom,id',
            'item_name' => [
                'required',
                'string',
                'max:255',
                $this->uniqueItemBrandRule($request->brand_id, $request->item_name),
            ],
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ], [
            'item_name.unique' => 'This item name already exists for the selected brand.',
        ]);

        ItemMasterlist::create($validated);

        return redirect()->back()->with('success', 'Item successfully created.');
    }

    public function update(Request $request, ItemMasterlist $itemmaster)
    {
        $this->normalizeRequest($request);

        $validated = $request->validate([
            'sku_id' => 'required|integer|exists:sku,id',
            'uom_id' => 'required|integer|exists:uom,id',
            'item_name' => [
                'required',
                'string',
                'max:255',
                $this->uniqueItemBrandRule($request->brand_id, $request->item_name, $itemmaster->id),
            ],
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ], [
            'item_name.unique' => 'This item name already exists for the selected brand.',
        ]);

        $itemmaster->update($validated);

        return redirect()->back()->with('success', 'Item successfully updated.');
    }

    public function destroy(ItemMasterlist $itemmaster)
    {
        $hasStockIn = DB::table('stock_in_logs')->where('item_id', $itemmaster->id)->exists();
        $mainInventory = DB::table('main_inventory')->where('item_id', $itemmaster->id)->first();

        if ($hasStockIn || ($mainInventory && $mainInventory->qty > 0)) {
            return redirect()->back()->withErrors([
                'delete' => 'Cannot delete this item because it has stock-in history or active inventory records.',
            ]);
        }

        $itemmaster->delete();

        return redirect()->back()->with('success', 'Item successfully deleted.');
    }

    private function normalizeRequest(Request $request): void
    {
        $cleanedName = trim(preg_replace('/\s+/', ' ', (string) $request->item_name));

        $request->merge([
            'item_name' => $cleanedName,
            'brand_id' => $request->brand_id ?: null,
            'model_id' => $request->model_id ?: null,
            'category_id' => $request->category_id ?: null,
        ]);
    }

    private function uniqueItemBrandRule(int|string|null $brandId, string $itemName, ?int $ignoreId = null)
{
    $normalizedName = mb_strtolower(trim(preg_replace('/\s+/', ' ', $itemName)));

    $rule = Rule::unique('item_masterlist')->where(function ($query) use ($brandId, $normalizedName) {
        $query->whereRaw('LOWER(TRIM(item_name)) = ?', [$normalizedName]);

        if (is_null($brandId)) {
            $query->whereNull('brand_id');
        } else {
            $query->where('brand_id', $brandId);
        }
    });

    if ($ignoreId !== null) {
        $rule->ignore($ignoreId);
    }

    return $rule;
}
}