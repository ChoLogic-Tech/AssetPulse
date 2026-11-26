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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AssetUnitController extends Controller
{
    private const ALLOWED_STATUSES = [
        'Available',
        'Deployed',
        'Under Repair',
        'Damage',
        'Back Load (Iloilo)',
        'Decommissioned',
    ];

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

        AssetUnits::create($validated);

        return redirect()->back()->with('success', 'Serialized asset unit registered.');
    }

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

        $assetUnit->update($validated);

        return redirect()->back()->with('success', 'Serialized asset unit updated.');
    }

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
            $assetUnit->delete();
        } catch (QueryException $e) {
            return redirect()->back()->withErrors([
                'delete' => 'Cannot delete this asset unit because it is referenced by other records.',
            ]);
        }

        return redirect()->back()->with('success', 'Serialized asset unit deleted.');
    }

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

        // If property changed (or was cleared) and location_id still points to a room
        // under a different property, clear location_id instead of failing validation
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

    private function messages(): array
    {
        return [
            'serial_number.unique' => 'This serial number is already registered.',
            'location_id.exists' => 'Selected storage room does not belong to the chosen property.',
        ];
    }

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