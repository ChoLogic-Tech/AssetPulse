<?php

namespace App\Http\Controllers;

use App\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UomController extends Controller
{
    public function index()
    {
        $uom = UnitOfMeasure::orderBy('name', 'ASC')->get();

        return Inertia::render('MasterData/UnitOfMeasures', [
            'unitofmeasures' => $uom,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:uom,code'],
            'name' => ['required', 'string', 'max:50', 'unique:uom,name'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        UnitOfMeasure::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'description' => isset($validated['description']) && trim($validated['description']) !== ''
                ? trim($validated['description'])
                : null,
        ]);

        return redirect()->back()->with('success', 'Unit of Measure successfully created.');
    }

    public function update(Request $request, UnitOfMeasure $unitofmeasure)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('uom', 'code')->ignore($unitofmeasure->id),
            ],
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('uom', 'name')->ignore($unitofmeasure->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $unitofmeasure->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'description' => isset($validated['description']) && trim($validated['description']) !== ''
                ? trim($validated['description'])
                : null,
        ]);

        return redirect()->back()->with('success', 'Unit of Measure successfully updated.');
    }

    public function destroy(UnitOfMeasure $unitofmeasure)
    {
        $unitofmeasure->delete();

        return redirect()->back()->with('success', 'Unit of Measure successfully deleted.');
    }
}