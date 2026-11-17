<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Inertia\Inertia;
use Illuminate\Http\Request;


class BrandController extends Controller {

    public function index () {

        $brand = Brand::orderBy('name', 'ASC')->get();

        return Inertia::render('MasterData/Brands', [
            'brand' => $brand
        ]);

    }

    public function store (Request $request) {

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:brands,name',
        ]);

        Brand::create($validated);

        return redirect()->back()->with('success', 'Brand successfully created.');

    }

    public function update (Request $request, Brand $brand) {

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:brands,name,' . $brand->id,
        ]);

        $brand->update($validated);

        return redirect()->back()->with('success', 'Brand successfully updateed.');
    }

    public function destroy (Request $request, Brand $brand) {

        $brand->delete();

        return redirect()->back()->with('success', 'Brand successfully deleted.');
    }

}