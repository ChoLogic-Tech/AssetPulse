<?php

namespace App\Http\Controllers;

use App\Models\AssetUnits;
use App\Models\Location;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LocationController extends Controller
{
    // Load locations, properties with total assigned asset counts, and serialized asset units
    public function index()
    {
        $locations = Location::with('property')->orderBy('name', 'ASC')->get();

        // Count assets linked directly to the property OR through a location belonging to that property
        $properties = Property::query()
            ->select('properties.*')
            ->selectSub(
                DB::table('asset_units')
                    ->leftJoin('locations', 'asset_units.location_id', '=', 'locations.id')
                    ->selectRaw('COUNT(*)')
                    ->where(function ($query) {
                        $query->whereColumn('asset_units.property_id', 'properties.id')
                            ->orWhereColumn('locations.property_id', 'properties.id');
                    }),
                'assets_count'
            )
            ->orderBy('name', 'ASC')
            ->get();

        $serializedasset = AssetUnits::orderBy('item_id', 'ASC')->get();

        return Inertia::render('MasterData/Locations', [
            'location' => $locations,
            'property' => $properties,
            'serializeasset' => $serializedasset,
        ]);
    }

    // Validate and create a new location scoped per property
    public function store(Request $request)
    {
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

    // Validate and update an existing location record
    public function update(Request $request, Location $locations)
    {
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

    // Delete a location unless PostgreSQL foreign key constraints prevent deletion
    public function destroy(Location $locations)
    {
        try {
            $locations->delete();

            return redirect()->back()->with('success', 'Location successfully deleted.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23503') {
                return redirect()->back()->with('error', 'Cannot delete this location because there is still assigned assets.');
            }

            throw $e;
        }
    }
}