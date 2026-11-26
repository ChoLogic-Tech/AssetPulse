<?php

namespace App\Http\Controllers;

use App\Models\AssetUnits;
use App\Models\Location;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LocationController extends Controller {
    public function index () {

    $locations = Location::with('property')->orderBy('name', 'ASC')->get();
    $properties= Property::orderBy('name', 'ASC')->get();
    $serializedasset = AssetUnits::orderBy('item_id', 'ASC')->get();

    return Inertia::render('MasterData/Locations', [
        'location' => $locations,
        'property' => $properties,
        'serializeasset' => $serializedasset
    ]);

    }
    
    public function store(Request $request) {

    $validated = $request->validate([
        'property_id' => ['required', 'integer', 'exists:properties,id'],
        'name' => [
            'required',
            'string',
            'max:50',
            Rule::unique('locations', 'name')->where(
                fn ($query) => $query->where('property_id', $request->input('property_id'))
            ),
        ],

    ]);

    Location::create($validated);

    return redirect()->back()->with('success', 'Location successfully created.');
    }

    public function update(Request $request, Location $locations) {
    $validated = $request->validate([
        'property_id' => ['required', 'integer', 'exists:properties,id'],
        'name' => [
            'required',
            'string',
            'max:50',
            Rule::unique('locations', 'name')
                ->where(fn ($query) => $query->where('property_id', $request->input('property_id')))
                ->ignore($locations->id),
        ],
    ]);

    $locations->update($validated);

    return redirect()->back()->with('success', 'Location successfully updated.');
    }

    public function destroy (Location $locations) {
        try {
            $locations->delete();
            
            return redirect()->back()->with('success', 'Location succcessfully deleted.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23503') {
                return redirect()->back()->with('error', 'Cannot delete this location because there is still assigned assets.');
            }

            throw $e;
        }
    }

}
