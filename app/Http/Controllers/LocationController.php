<?php

namespace App\Http\Controllers;

use App\Models\AssetUnits;
use App\Models\Location;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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

    // Validate and create a new location scoped per property, then record an audit log
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

        DB::transaction(function () use ($validated) {
            $locationName = trim((string) $validated['name']);
            $propertyId = (int) $validated['property_id'];

            // Create the new location record
            $location = Location::create([
                'property_id' => $propertyId,
                'name' => $locationName,
            ]);

            $propertyName = (string) DB::table('properties')
                ->where('id', $propertyId)
                ->value('name');

            // Record human-readable creation log
            $description = $propertyName !== ''
                ? sprintf('Created location %s under %s', $locationName, $propertyName)
                : sprintf('Created location %s', $locationName);

            $this->writeAuditLog(
                actionType: 'LOCATION_CREATE',
                recordId: (int) $location->id,
                description: $description
            );
        });

        return redirect()->back()->with('success', 'Location successfully created.');
    }

    // Validate and update an existing location record, then record an audit log
    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('locations', 'name')
                    ->where(fn ($query) => $query->where('property_id', $request->input('property_id')))
                    ->ignore($location->id),
            ],
        ]);

        DB::transaction(function () use ($location, $validated) {
            $oldName = (string) $location->name;
            $oldPropertyId = (int) $location->property_id;

            $newName = trim((string) $validated['name']);
            $newPropertyId = (int) $validated['property_id'];

            // Update the location record
            $location->update([
                'property_id' => $newPropertyId,
                'name' => $newName,
            ]);

            $propertyName = (string) DB::table('properties')
                ->where('id', $newPropertyId)
                ->value('name');

            $details = [];
            if ($oldName !== $newName) {
                $details[] = "{$oldName} -> {$newName}";
            }
            if ($oldPropertyId !== $newPropertyId && $propertyName !== '') {
                $details[] = "moved to {$propertyName}";
            }

            // Record human-readable update log
            $description = !empty($details)
                ? sprintf('Updated location %s (%s)', $newName, implode(', ', $details))
                : sprintf('Updated location %s', $newName);

            $this->writeAuditLog(
                actionType: 'LOCATION_UPDATE',
                recordId: (int) $location->id,
                description: $description
            );
        });

        return redirect()->back()->with('success', 'Location successfully updated.');
    }

    // Block deletion if asset_units still reference this location_id, otherwise delete and log
    public function destroy(Location $location)
    {
        DB::transaction(function () use ($location) {
            $locationId = (int) $location->id;
            $locationName = (string) $location->name;
            $propertyName = (string) DB::table('properties')
                ->where('id', (int) $location->property_id)
                ->value('name');

            // Count serialized asset units currently assigned to this location
            $assignedAssetsCount = (int) DB::table('asset_units')
                ->where('location_id', $locationId)
                ->count();

            if ($assignedAssetsCount > 0) {
                $assetLabel = $assignedAssetsCount === 1 ? 'assigned asset' : 'assigned assets';

                throw ValidationException::withMessages([
                    'location' => [
                        "Cannot delete {$locationName} because it has {$assignedAssetsCount} {$assetLabel}.",
                    ],
                ]);
            }

            $location->delete();

            // Record human-readable deletion log
            $description = $propertyName !== ''
                ? sprintf('Deleted location %s from %s', $locationName, $propertyName)
                : sprintf('Deleted location %s', $locationName);

            $this->writeAuditLog(
                actionType: 'LOCATION_DELETE',
                recordId: $locationId,
                description: $description
            );
        });

        return redirect()->back()->with('success', 'Location successfully deleted.');
    }

    // Write an audit log row for location management actions
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $actor = Auth::user();
        if (!$actor) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id' => $actor->id,
            'action_type' => $actionType,
            'table_name' => 'locations',
            'record_id' => $recordId,
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}