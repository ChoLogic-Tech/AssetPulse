<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ItemMasterlist;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Inertia\Inertia;

class CategoryController extends Controller
{
    
    public function index () {
        $category = Category::orderBy('name', 'ASC' )->get();

        return Inertia::render('MasterData/Categories', [
            'category' => $category,
            'itemmaster' => ItemMasterlist::orderBy('item_name', 'ASC')->get(),
        ]);
    }

    public function store (Request $request) {

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:categories,name',
        ]);

        Category::create($validated);

        return redirect()->back()->with('success', 'Category successfully created.');

    }

    public function update (Request $request, Category $category) {

        $validated =$request->validate([
            'name' => 'required|string|max:50|unique:categories,name,' . $category->id,
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category successfully updated.');

    }

    public function destroy (Category $category) {
        try {
            $category->delete();
            
            return redirect()->back()->with('success', 'Category succcessfully deleted.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23503') {
                return redirect()->back()->with('error', 'Cannot delete this category because it is still being used by active item.');
            }

            throw $e;
        }
    }
}
