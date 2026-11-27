<?php

namespace App\Http\Controllers;

use App\Models\AssetUnits;
use App\Models\ItemMasterlist;
use App\Models\Location;
use App\Models\Property;
use App\Models\Sku;
use App\Models\Supplier;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AssetUnitController extends Controller
{
    // Accepted status values without redundant 'In Use' / 'Deployed' duplicates
    private const ALLOWED_STATUSES = [
        'In Warehouse',
        'In Property',
        'Available',
        'Deployed',
        'Under Repair',
        'Damage',
        'Back Load (Iloilo)',
        'Decommissioned',
    ];

    // Load serialized asset units with joined item, property, room location, and supplier names
    public function index()
    {
        $assetUnits = DB::table('asset_units as au')
            ->leftJoin('item_masterlist as im', 'au.item_id', '=', 'im.id')
            ->leftJoin('properties as p', 'au.property_id', '=', 'p.id')
            ->leftJoin('locations as l', 'au.location_id', '=', 'l.id')
            ->leftJoin('suppliers as s', 'au.supplier_id', '=', 's.id')
            ->select(
                'au.id',
                'au.item_id',
                'au.supplier_id',
                'au.serial_number',
                'au.status',
                'au.property_id',
                'au.location_id',
                'au.date_received',
                'im.item_name',
                'p.name as property_name',
                'l.name as location_name',
                's.name as supplier_name'
            )
            ->orderBy('im.item_name', 'ASC')
            ->orderBy('au.serial_number', 'ASC')
            ->get();

        $items = ItemMasterlist::orderBy('item_name', 'ASC')->get();
        $skus = Sku::orderBy('sku_code', 'ASC')->get();
        $properties = Property::orderBy('name', 'ASC')->get();
        $locations = Location::orderBy('name', 'ASC')->get();
        $suppliers = Supplier::orderBy('name', 'ASC')->get();

        return Inertia::render('MasterData/AssetUnits', [
            'assetUnits' => $assetUnits,
            'items' => $items,
            'skus' => $skus,
            'properties' => $properties,
            'locations' => $locations,
            'suppliers' => $suppliers,
        ]);
    }

    // Validate and register a new serialized asset unit, then write a concise audit log
    public function store(Request $request)
    {
        $this->normalizeRequest($request);

        $validated = $request->validate(
            $this->rules($request),
            $this->messages()
        );

        if (empty($validated['date_received'])) {
            unset($validated['date_received']); // Let PostgreSQL CURRENT_TIMESTAMP default apply
        }

        DB::transaction(function () use ($validated) {
            $unit = AssetUnits::create($validated);

            $serial = (string) $unit->serial_number;
            $uomLabel = $this->resolveItemUomLabel($unit->item_id ? (int) $unit->item_id : null);
            $locationName = $unit->location_id
                ? (string) DB::table('locations')->where('id', $unit->location_id)->value('name')
                : '';
            $propertyName = $unit->property_id
                ? ((string) DB::table('properties')->where('id', $unit->property_id)->value('name') ?: 'Central Warehouse')
                : 'Central Warehouse';

            // Use the room/location name (which already carries its prefix) or fall back to property/warehouse
            $placeLabel = $locationName !== '' ? $locationName : $propertyName;

            if ($locationName !== '' || $unit->status === 'Deployed') {
                $description = sprintf(
                    'Deployed 1 %s (%s) in use at %s',
                    $uomLabel,
                    $serial,
                    $placeLabel
                );
            } else {
                $description = sprintf(
                    'Registered 1 %s (%s) at %s',
                    $uomLabel,
                    $serial,
                    $placeLabel
                );
            }

            $this->writeAuditLog(
                actionType: 'ASSET_UNIT_CREATE',
                recordId: (int) $unit->getKey(),
                description: $description
            );
        });

        return redirect()->back()->with('success', 'Serialized asset unit registered.');
    }

    // Validate and update an existing serialized asset unit, then write a concise audit log
    public function update(Request $request, $assetunit)
    {
        $assetUnit = $assetunit instanceof AssetUnits
            ? $assetunit
            : AssetUnits::findOrFail($assetunit);

        $this->normalizeRequest($request, $assetUnit);

        $validated = $request->validate(
            $this->rules($request, $assetUnit->getKey()),
            $this->messages()
        );

        if (empty($validated['date_received'])) {
            unset($validated['date_received']);
        }

        DB::transaction(function () use ($assetUnit, $validated) {
            $oldSerial = (string) $assetUnit->serial_number;
            $oldStatus = (string) $assetUnit->status;
            $oldPropertyId = $assetUnit->property_id ? (int) $assetUnit->property_id : null;
            $oldLocationId = $assetUnit->location_id ? (int) $assetUnit->location_id : null;

            $assetUnit->update($validated);

            $newSerial = (string) $assetUnit->serial_number;
            $newStatus = (string) $assetUnit->status;
            $newPropertyId = $assetUnit->property_id ? (int) $assetUnit->property_id : null;
            $newLocationId = $assetUnit->location_id ? (int) $assetUnit->location_id : null;

            $uomLabel = $this->resolveItemUomLabel($assetUnit->item_id ? (int) $assetUnit->item_id : null);
            $newLocName = $newLocationId
                ? (string) DB::table('locations')->where('id', $newLocationId)->value('name')
                : '';
            $newPropName = $newPropertyId
                ? ((string) DB::table('properties')->where('id', $newPropertyId)->value('name') ?: 'Central Warehouse')
                : 'Central Warehouse';

            // Collect non-room changes so we don't repeat the room assignment
            $otherChanges = [];

            if ($oldSerial !== $newSerial) {
                $otherChanges[] = "Serial: {$oldSerial} -> {$newSerial}";
            }

            if ($oldStatus !== $newStatus) {
                $otherChanges[] = "Status: {$oldStatus} -> {$newStatus}";
            }

            if ($oldPropertyId !== $newPropertyId) {
                $oldPropName = $oldPropertyId
                    ? (DB::table('properties')->where('id', $oldPropertyId)->value('name') ?: 'Central Warehouse')
                    : 'Central Warehouse';
                $otherChanges[] = "Property: {$oldPropName} -> {$newPropName}";
            }

            $isNewlyDeployedToLocation =
                ($newLocationId !== null && $oldLocationId !== $newLocationId)
                || ($newStatus === 'Deployed' && $oldStatus !== 'Deployed');

            if ($isNewlyDeployedToLocation) {
                $placeLabel = $newLocName !== '' ? $newLocName : $newPropName;
                $extraNotes = !empty($otherChanges)
                    ? ' (' . implode(', ', $otherChanges) . ')'
                    : '';

                $description = sprintf(
                    'Deployed 1 %s (%s) in use at %s%s',
                    $uomLabel,
                    $newSerial,
                    $placeLabel,
                    $extraNotes
                );
            } else {
                $allChanges = $otherChanges;

                if ($oldLocationId !== $newLocationId) {
                    $oldLocName = $oldLocationId
                        ? (DB::table('locations')->where('id', $oldLocationId)->value('name') ?: 'Unassigned')
                        : 'Unassigned';
                    $currentLocLabel = $newLocName !== '' ? $newLocName : 'Unassigned';
                    $allChanges[] = "Room: {$oldLocName} -> {$currentLocLabel}";
                }

                $description = !empty($allChanges)
                    ? sprintf('Updated 1 %s (%s) — %s', $uomLabel, $newSerial, implode(', ', $allChanges))
                    : sprintf('Updated 1 %s (%s)', $uomLabel, $newSerial);
            }

            $this->writeAuditLog(
                actionType: 'ASSET_UNIT_UPDATE',
                recordId: (int) $assetUnit->getKey(),
                description: $description
            );
        });

        return redirect()->back()->with('success', 'Serialized asset unit updated.');
    }

    // Delete an asset unit unless deployed or referenced by movement/release history, and write a concise audit log
    public function destroy($assetunit)
    {
        $assetUnit = $assetunit instanceof AssetUnits
            ? $assetunit
            : AssetUnits::findOrFail($assetunit);

        $isDeployed = $assetUnit->status === 'Deployed';
        $hasMovementLogs = Schema::hasTable('asset_movement_logs')
            && DB::table('asset_movement_logs')
                ->where('asset_unit_id', $assetUnit->getKey())
                ->exists();

        if ($isDeployed || $hasMovementLogs) {
            return redirect()->back()->withErrors([
                'delete' => 'Cannot delete this asset unit because it is currently deployed or has movement history.',
            ]);
        }

        try {
            DB::transaction(function () use ($assetUnit) {
                $unitId = (int) $assetUnit->getKey();
                $serial = (string) $assetUnit->serial_number;
                $uomLabel = $this->resolveItemUomLabel($assetUnit->item_id ? (int) $assetUnit->item_id : null);

                $assetUnit->delete();

                $this->writeAuditLog(
                    actionType: 'ASSET_UNIT_DELETE',
                    recordId: $unitId,
                    description: sprintf('Deleted 1 %s (%s)', $uomLabel, $serial)
                );
            });
        } catch (QueryException $e) {
            return redirect()->back()->withErrors([
                'delete' => 'Cannot delete this asset unit because it is referenced by other records.',
            ]);
        }

        return redirect()->back()->with('success', 'Serialized asset unit deleted.');
    }

    // Look up the catalog item's unit of measure (e.g., unit, box, pcs) for readable audit descriptions
    private function resolveItemUomLabel(?int $itemId): string
    {
        if (!$itemId) {
            return 'unit';
        }

        $uomName = DB::table('item_masterlist as im')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->where('im.id', $itemId)
            ->value('u.name');

        $cleanUom = trim((string) ($uomName ?? ''));

        return $cleanUom !== '' ? strtolower($cleanUom) : 'unit';
    }

    // Write an audit log row for serialized asset unit actions
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $actor = Auth::user();
        if (!$actor) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id' => $actor->id,
            'action_type' => $actionType,
            'table_name' => 'asset_units',
            'record_id' => $recordId,
            'description' => $description,
            'created_at' => now(),
        ]);
    }

    // Normalize serial formatting, foreign keys, and property/room consistency before validation
    private function normalizeRequest(Request $request, ?AssetUnits $existingUnit = null): void
    {
        $rawSerial = $request->has('serial_number') && $request->serial_number !== null && $request->serial_number !== ''
            ? (string) $request->serial_number
            : (string) ($existingUnit?->serial_number ?? '');

        $cleanedSerial = strtoupper(trim(preg_replace('/\s+/', ' ', $rawSerial)));

        $itemId = $request->has('item_id')
            ? ($request->item_id ?: null)
            : ($existingUnit?->item_id ?? null);

        $propertyId = $request->has('property_id')
            ? ($request->property_id ?: null)
            : ($existingUnit?->property_id ?? null);

        $locationId = $request->has('location_id')
            ? ($request->location_id ?: null)
            : ($existingUnit?->location_id ?? null);

        // Clear location_id if it does not belong to the chosen property
        if ($locationId !== null) {
            $locationRow = DB::table('locations')->where('id', $locationId)->first();
            if (!$locationRow) {
                $locationId = null;
            } elseif ($propertyId !== null && (string) $locationRow->property_id !== (string) $propertyId) {
                $locationId = null;
            } elseif ($propertyId === null && $locationRow->property_id !== null) {
                $locationId = null;
            }
        }

        $supplierId = $request->has('supplier_id')
            ? ($request->supplier_id ?: null)
            : ($existingUnit?->supplier_id ?? null);

        $status = $request->has('status') && $request->status !== ''
            ? $request->status
            : ($existingUnit?->status ?? 'Available');

        $request->merge([
            'item_id' => $itemId,
            'supplier_id' => $supplierId,
            'property_id' => $propertyId,
            'location_id' => $locationId,
            'serial_number' => $cleanedSerial,
            'status' => $status,
        ]);
    }

    // Validation rules for creating and updating asset units
    private function rules(Request $request, $ignoreId = null): array
    {
        return [
            'item_id' => ['required', 'integer', 'exists:item_masterlist,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'location_id' => [
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) use ($request) {
                    if ($request->property_id) {
                        $query->where('property_id', $request->property_id);
                    }
                }),
            ],
            'serial_number' => [
                'required',
                'string',
                'max:100',
                $this->uniqueSerialRule((string) $request->serial_number, $ignoreId),
            ],
            'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
            'date_received' => ['nullable', 'date'],
        ];
    }

    // Custom validation messages
    private function messages(): array
    {
        return [
            'serial_number.unique' => 'This serial number is already registered.',
            'location_id.exists' => 'Selected storage room does not belong to the chosen property.',
        ];
    }

    // Case-insensitive, whitespace-normalized uniqueness check on serial_number
    private function uniqueSerialRule(string $serialNumber, $ignoreId = null)
    {
        $normalizedSerial = mb_strtolower(trim(preg_replace('/\s+/', ' ', $serialNumber)));

        $rule = Rule::unique('asset_units')->where(function ($query) use ($normalizedSerial) {
            $query->whereRaw('LOWER(TRIM(serial_number)) = ?', [$normalizedSerial]);
        });

        if ($ignoreId !== null) {
            $model = new AssetUnits();
            $rule->ignore($ignoreId, $model->getKeyName());
        }

        return $rule;
    }
}