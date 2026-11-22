<?php

namespace App\Http\Controllers;

use App\Models\Sku;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SkuController extends Controller
{
    public function index()
    {
        $skus = Sku::orderBy('sku_code', 'ASC')->get();

        return Inertia::render('MasterData/Skus', [
            'sku' => $skus,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku_code' => ['required', 'string', 'max:50', 'unique:sku,sku_code'],
            'descriptions' => ['nullable', 'string', 'max:255'],
        ]);

        Sku::create($validated);

        return redirect()->back()->with('success', 'SKU successfully created.');
    }

    public function update(Request $request, Sku $sku)
    {
        $validated = $request->validate([
            'sku_code' => ['required', 'string', 'max:50', 'unique:sku,sku_code,' . $sku->id],
            'descriptions' => ['nullable', 'string', 'max:255'],
        ]);

        $sku->update($validated);

        return redirect()->back()->with('success', 'SKU successfully updated.');
    }

    public function destroy(Sku $sku)
    {
        try {
            $sku->delete();
            
            return redirect()->back()->with('success', 'SKU succcessfully deleted.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23503') {
                return redirect()->back()->with('error', 'Cannot delete this sku because it is still assigned by an active item.');
            }

            throw $e;
        }
    }
}