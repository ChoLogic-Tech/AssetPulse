<?php

namespace App\Http\Controllers;

use App\Models\Models;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModelController extends Controller {

    public function index() {
        // Fetch models and also load their related brand if you have a relation set up, 
        // or just fetch all brands for the autocomplete search.
        $models = Models::with('brand')->orderBy('name', 'ASC')->get();
        $brands = Brand::orderBy('name', 'ASC')->get();

        return Inertia::render('MasterData/Models', [
            'model'  => $models,
            'brands' => $brands // <-- Passed so your modal autocomplete works!
        ]);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'name'     => 'required|string|max:50|unique:models,name',
            'brand_id' => 'required|exists:brands,id', // Added validation rules
        ]);

        Models::create($validated); // Changed from 'created' to 'create'

        return redirect()->back()->with('success', 'Model successfully created.');
    }

    public function update(Request $request, Models $model) {
        $validated = $request->validate([
            'name'     => 'required|string|max:50|unique:models,name,' . $model->id,
            'brand_id' => 'required|exists:brands,id',
        ]);

        $model->update($validated);

        return redirect()->back()->with('success', 'Model successfully updated.');
    }

    public function destroy(Models $model) {
        $model->delete();

        return redirect()->back()->with('success', 'Model successfully deleted.');
    }
}