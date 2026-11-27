<?php

namespace App\Http\Controllers;

use App\Models\WarehouseStockin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PropertyStockInController extends Controller
{
    // Load property stock-in logs, property stock balances, and dropdown data
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $propertyFilter = $request->input('property_id');

        // Query stock-in logs that belong to a property (property_id is not null)
        $stockInsQuery = WarehouseStockin::query()
            ->whereNotNull('stock_in_logs.property_id')
            ->leftJoin('item_masterlist as im', 'stock_in_logs.item_id', '=', 'im.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('suppliers as sup', 'stock_in_logs.supplier_id', '=', 'sup.id')
            ->leftJoin('properties as prop', 'stock_in_logs.property_id', '=', 'prop.id')
            ->leftJoin('users as u', 'stock_in_logs.received_by', '=', 'u.id')
            ->select([
                'stock_in_logs.id',
                'stock_in_logs.item_id',
                'stock_in_logs.supplier_id',
                'stock_in_logs.property_id',
                'stock_in_logs.received_by',
                'stock_in_logs.quantity',
                'stock_in_logs.rf_number',
                'stock_in_logs.invoice_number',
                'stock_in_logs.received_date',
                'stock_in_logs.remarks',
                'im.item_name',
                's.sku_code as sku',
                'sup.name as supplier_name',
                'prop.name as property_name',
                DB::raw("CONCAT_WS(' ', u.fname, u.lname) as received_by_name"),
            ]);

        // Filter stock-in logs by search keyword
        if ($search !== '') {
            $like = '%' . $search . '%';
            $stockInsQuery->where(function ($q) use ($like) {
                $q->where('stock_in_logs.rf_number', 'ilike', $like)
                    ->orWhere('stock_in_logs.invoice_number', 'ilike', $like)
                    ->orWhere('stock_in_logs.remarks', 'ilike', $like)
                    ->orWhere('im.item_name', 'ilike', $like)
                    ->orWhere('s.sku_code', 'ilike', $like)
                    ->orWhere('sup.name', 'ilike', $like)
                    ->orWhere('prop.name', 'ilike', $like);
            });
        }

        // Filter stock-in logs by property_id when selected
        if (!empty($propertyFilter) && is_numeric($propertyFilter)) {
            $stockInsQuery->where('stock_in_logs.property_id', (int) $propertyFilter);
        }

        $stockIns = $stockInsQuery
            ->orderByDesc('stock_in_logs.received_date')
            ->orderByDesc('stock_in_logs.id')
            ->paginate(5)
            ->withQueryString();

        // Query property_inventory with latest RF, previous RF, and total stock-in per property + item
        $propertyInventoryQuery = DB::table('property_inventory as pi')
            ->join('properties as prop', 'pi.property_id', '=', 'prop.id')
            ->join('item_masterlist as im', 'pi.item_id', '=', 'im.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->leftJoin('categories as c', 'im.category_id', '=', 'c.id')
            ->leftJoin('stock_in_logs as sil', function ($join) {
                $join->on('sil.property_id', '=', 'pi.property_id')
                    ->on('sil.item_id', '=', 'pi.item_id');
            })
            ->select([
                'pi.id',
                'pi.property_id',
                'pi.item_id',
                'pi.qty',
                'pi.rf_num',
                'pi.previous_rf_num',
                'pi.last_updated',
                'prop.name as property_name',
                'im.item_name',
                'im.category_id',
                'im.uom_id',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
                DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
                'u.code as uom_code',
                DB::raw("COALESCE(c.name, 'Uncategorized') as category_name"),
                DB::raw('COALESCE(SUM(sil.quantity), 0) as stockin'),
            ])
            ->groupBy([
                'pi.id',
                'pi.property_id',
                'pi.item_id',
                'pi.qty',
                'pi.rf_num',
                'pi.previous_rf_num',
                'pi.last_updated',
                'prop.name',
                'im.item_name',
                'im.category_id',
                'im.uom_id',
                's.sku_code',
                'u.name',
                'u.code',
                'c.name',
            ]);

        if (!empty($propertyFilter) && is_numeric($propertyFilter)) {
            $propertyInventoryQuery->where('pi.property_id', (int) $propertyFilter);
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $propertyInventoryQuery->where(function ($q) use ($like) {
                $q->where('im.item_name', 'ilike', $like)
                    ->orWhere('s.sku_code', 'ilike', $like)
                    ->orWhere('prop.name', 'ilike', $like)
                    ->orWhere('pi.rf_num', 'ilike', $like)
                    ->orWhere('pi.previous_rf_num', 'ilike', $like);
            });
        }

        $propertyInventory = $propertyInventoryQuery
            ->orderBy('prop.name')
            ->orderBy('im.item_name')
            ->get();

        // Load catalog items for the modal dropdown
        $items = DB::table('item_masterlist as im')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->select([
                'im.id',
                'im.item_name',
                'im.uom_id',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
                DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
                'u.code as uom_code',
            ])
            ->orderBy('im.item_name')
            ->get();

        // Load suppliers, properties, and room/storage locations
        $suppliers = DB::table('suppliers')->select('id', 'name')->orderBy('name')->get();
        $properties = DB::table('properties')->select('id', 'name')->orderBy('name')->get();
        $locations = DB::table('locations')->select('id', 'name', 'property_id')->orderBy('name')->get();

        // Get the latest supplier used per item for property stock-ins
        $lastSuppliers = DB::table('stock_in_logs as sil')
            ->join('suppliers as sup', 'sil.supplier_id', '=', 'sup.id')
            ->whereNotNull('sil.property_id')
            ->whereNotNull('sil.supplier_id')
            ->orderByDesc('sil.received_date')
            ->orderByDesc('sil.id')
            ->select([
                'sil.item_id',
                'sil.property_id',
                'sil.supplier_id',
                'sup.name as supplier_name',
                'sil.received_date',
            ])
            ->get()
            ->unique('item_id')
            ->keyBy('item_id');

        // Load available serial units that have not been stocked in yet
        $availableAssetUnits = DB::table('asset_units as au')
            ->leftJoin('properties as p', 'au.property_id', '=', 'p.id')
            ->leftJoin('locations as l', 'au.location_id', '=', 'l.id')
            ->where('au.status', 'Available')
            ->whereNull('au.stock_in_log_id')
            ->select([
                'au.id',
                'au.item_id',
                'au.supplier_id',
                'au.property_id',
                'au.location_id',
                'au.stock_in_log_id',
                'au.serial_number',
                'au.status',
                'au.date_received',
                'p.name as property_name',
                'l.name as location_name',
            ])
            ->orderByDesc('au.id')
            ->get();

        return Inertia::render('Inventory/PropertyStockIn', [
            'propertyInventory' => $propertyInventory,
            'stockIns' => $stockIns,
            'items' => $items,
            'suppliers' => $suppliers,
            'properties' => $properties,
            'locations' => $locations,
            'assetUnits' => $availableAssetUnits,
            'lastSuppliers' => $lastSuppliers,
            'filters' => [
                'search' => $search,
                'property_id' => $propertyFilter,
            ],
        ]);
    }

    // Create a new property stock-in entry inside a transaction
    public function store(Request $request)
    {
        $normalized = $this->normalizePayload($request);
        $validated = $this->validateStockIn($request, $normalized);

        DB::transaction(function () use ($validated) {
            // Read current RF before insert so we can record previous RF in the audit log if it changes
            $prevPropertyRf = DB::table('property_inventory')
                ->where('property_id', (int) $validated['property_id'])
                ->where('item_id', (int) $validated['item_id'])
                ->value('rf_num');

            $effectiveSupplierId = $this->resolveEffectiveSupplierId($validated);

            // Insert stock-in log row (database trigger updates property_inventory)
            $stockIn = WarehouseStockin::create([
                'item_id' => $validated['item_id'],
                'supplier_id' => $effectiveSupplierId,
                'property_id' => $validated['property_id'],
                'received_by' => Auth::id(),
                'quantity' => $validated['quantity'],
                'rf_number' => $validated['rf_number'],
                'invoice_number' => $validated['invoice_number'],
                'received_date' => $validated['received_date'],
                'remarks' => $validated['remarks'],
            ]);

            // Sync selected existing serials or insert new serials into asset_units
            $this->syncAssetUnits((int) $stockIn->id, $validated, $effectiveSupplierId);

            // Build human-readable audit log entry without parentheses or duplicate SN:
            $serials = $this->getStockInSerialNumbers((int) $stockIn->id);
            $serialSuffix = $this->formatSerialSuffix($serials);
            $itemName = $this->getItemName((int) $validated['item_id']);
            $locationName = $this->getLocationName((int) $validated['property_id']);
            $rfLabel = $this->formatRfNumber((string) $validated['rf_number']);

            $prevRfPart = '';
            if (filled($prevPropertyRf) && (string) $prevPropertyRf !== (string) $validated['rf_number']) {
                $prevRfPart = ', Prev ' . $this->formatRfNumber((string) $prevPropertyRf);
            }

            $this->writeAuditLog(
                actionType: 'STOCK_IN_CREATE',
                recordId: (int) $stockIn->id,
                description: sprintf(
                    'Stocked in %d pcs of %s%s at %s — %s%s, Stock-in table #%d',
                    $validated['quantity'],
                    $itemName,
                    $serialSuffix,
                    $locationName,
                    $rfLabel,
                    $prevRfPart,
                    $stockIn->id
                )
            );
        });

        return back()->with('success', 'Property stock-in recorded successfully.');
    }

    // Update an existing property stock-in and recalculate property_inventory + asset_units
    public function update(Request $request, int $propertystockin)
    {
        $stockIn = WarehouseStockin::findOrFail($propertystockin);
        $normalized = $this->normalizePayload($request);
        $validated = $this->validateStockIn($request, $normalized);

        DB::transaction(function () use ($stockIn, $validated) {
            $oldPropertyId = $stockIn->property_id !== null ? (int) $stockIn->property_id : null;
            $oldItemId = (int) $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;
            $oldRfNumber = (string) $stockIn->rf_number;
            $stockInId = (int) $stockIn->id;

            $oldSerials = $this->getStockInSerialNumbers($stockInId);

            // Reverse old serial assignments and old property stock quantity first
            $this->rollbackStockInAssetUnits($stockInId);
            $this->reversePropertyInventoryEffect($oldPropertyId, $oldItemId, $oldQty);

            $effectiveSupplierId = $this->resolveEffectiveSupplierId($validated);

            $stockIn->update([
                'item_id' => $validated['item_id'],
                'supplier_id' => $effectiveSupplierId,
                'property_id' => $validated['property_id'],
                'quantity' => $validated['quantity'],
                'rf_number' => $validated['rf_number'],
                'invoice_number' => $validated['invoice_number'],
                'received_date' => $validated['received_date'],
                'remarks' => $validated['remarks'],
            ]);

            $isLatestPropertyStockIn = !DB::table('stock_in_logs')
                ->where('property_id', (int) $validated['property_id'])
                ->where('item_id', (int) $validated['item_id'])
                ->where('id', '>', $stockInId)
                ->exists();

            // Apply updated quantity and RF, then sync serial units
            $this->applyPropertyInventoryEffect(
                propertyId: (int) $validated['property_id'],
                itemId: (int) $validated['item_id'],
                qty: (int) $validated['quantity'],
                rfNumber: (string) $validated['rf_number'],
                updateRfNum: $isLatestPropertyStockIn
            );

            $this->syncAssetUnits($stockInId, $validated, $effectiveSupplierId);

            $newSerials = $this->getStockInSerialNumbers($stockInId);

            $this->writeAuditLog(
                actionType: 'STOCK_IN_UPDATE',
                recordId: $stockInId,
                description: sprintf(
                    'Updated stock-in table #%d: %s%s at %s — %s, %d pcs -> %s%s at %s — %s, %d pcs',
                    $stockInId,
                    $this->getItemName($oldItemId),
                    $this->formatSerialSuffix($oldSerials),
                    $this->getLocationName($oldPropertyId),
                    $this->formatRfNumber($oldRfNumber),
                    $oldQty,
                    $this->getItemName((int) $validated['item_id']),
                    $this->formatSerialSuffix($newSerials),
                    $this->getLocationName((int) $validated['property_id']),
                    $this->formatRfNumber((string) $validated['rf_number']),
                    $validated['quantity']
                )
            );
        });

        return back()->with('success', 'Property stock-in updated successfully.');
    }

    // Delete a property stock-in entry and reverse its stock, serial, and RF effects
    public function destroy(int $propertystockin)
    {
        $stockIn = WarehouseStockin::findOrFail($propertystockin);

        DB::transaction(function () use ($stockIn) {
            $oldPropertyId = $stockIn->property_id !== null ? (int) $stockIn->property_id : null;
            $oldItemId = (int) $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;
            $oldRfNumber = (string) $stockIn->rf_number;
            $stockInId = (int) $stockIn->id;

            $oldSerials = $this->getStockInSerialNumbers($stockInId);

            $this->rollbackStockInAssetUnits($stockInId);
            $this->reversePropertyInventoryEffect($oldPropertyId, $oldItemId, $oldQty);
            $stockIn->delete();

            // Refresh latest and previous RF numbers from remaining logs
            $this->syncPropertyRfAfterDelete($oldPropertyId, $oldItemId);

            $this->writeAuditLog(
                actionType: 'STOCK_IN_DELETE',
                recordId: $stockInId,
                description: sprintf(
                    'Deleted stock-in table #%d: %d pcs of %s%s at %s — %s',
                    $stockInId,
                    $oldQty,
                    $this->getItemName($oldItemId),
                    $this->formatSerialSuffix($oldSerials),
                    $this->getLocationName($oldPropertyId),
                    $this->formatRfNumber($oldRfNumber)
                )
            );
        });

        return back()->with('success', 'Property stock-in deleted successfully.');
    }

    // Use explicit supplier_id or inherit a single common supplier from selected serial units
    private function resolveEffectiveSupplierId(array $validated): ?int
    {
        if ($validated['supplier_id'] !== null) {
            return (int) $validated['supplier_id'];
        }

        if (!empty($validated['selected_asset_unit_ids'])) {
            $distinctIds = DB::table('asset_units')
                ->whereIn('id', $validated['selected_asset_unit_ids'])
                ->whereNotNull('supplier_id')
                ->distinct()
                ->pluck('supplier_id');

            if ($distinctIds->count() === 1) {
                return (int) $distinctIds->first();
            }
        }

        return null;
    }

    // Release serialized units linked to this stock-in if none are Deployed
    private function rollbackStockInAssetUnits(int $stockInId): void
    {
        $units = DB::table('asset_units')
            ->where('stock_in_log_id', $stockInId)
            ->lockForUpdate()
            ->get();

        foreach ($units as $unit) {
            if ($unit->status === 'Deployed') {
                throw ValidationException::withMessages([
                    'quantity' => [
                        "Serial {$unit->serial_number} is already {$unit->status} and cannot be modified or removed.",
                    ],
                ]);
            }
        }

        DB::table('asset_units')
            ->where('stock_in_log_id', $stockInId)
            ->update([
                'stock_in_log_id' => null,
                'property_id' => null,
                'location_id' => null,
                'status' => 'Available',
            ]);
    }

    // Link selected existing serials or insert new serial numbers into asset_units
    private function syncAssetUnits(int $stockInId, array $validated, ?int $effectiveSupplierId): void
    {
        $propertyId = (int) $validated['property_id'];
        $locationId = $validated['location_id'] ?? null;

        if (!empty($validated['selected_asset_unit_ids'])) {
            $explicitSupplierId = $validated['supplier_id'] !== null
                ? (int) $validated['supplier_id']
                : null;

            $supplierExpr = $explicitSupplierId !== null
                ? (string) $explicitSupplierId
                : ($effectiveSupplierId !== null
                    ? 'COALESCE(supplier_id, ' . (int) $effectiveSupplierId . ')'
                    : 'supplier_id');

            $updatedCount = DB::table('asset_units')
                ->whereIn('id', $validated['selected_asset_unit_ids'])
                ->where('item_id', $validated['item_id'])
                ->where('status', 'Available')
                ->whereNull('stock_in_log_id')
                ->update([
                    'stock_in_log_id' => $stockInId,
                    'property_id' => $propertyId,
                    'location_id' => $locationId,
                    'supplier_id' => DB::raw($supplierExpr),
                    'status' => 'In Property',
                    'date_received' => $validated['received_date'],
                ]);

            if ($updatedCount !== count($validated['selected_asset_unit_ids'])) {
                throw ValidationException::withMessages([
                    'selected_asset_unit_ids' => ['One or more selected serialized units were already stocked in.'],
                ]);
            }
        }

        if (!empty($validated['new_serial_numbers'])) {
            $rows = array_map(fn ($serial) => [
                'item_id' => $validated['item_id'],
                'supplier_id' => $effectiveSupplierId,
                'stock_in_log_id' => $stockInId,
                'serial_number' => $serial,
                'status' => 'In Property',
                'property_id' => $propertyId,
                'location_id' => $locationId,
                'date_received' => $validated['received_date'],
            ], $validated['new_serial_numbers']);

            DB::table('asset_units')->insert($rows);
        }
    }

    // Normalize form values and deduplicate serial numbers before validation
    private function normalizePayload(Request $request): array
    {
        $selectedIds = collect($request->input('selected_asset_unit_ids', []))
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $rawNewSerials = collect($request->input('new_serial_numbers', []))
            ->map(fn ($serial) => trim((string) $serial))
            ->filter()
            ->values()
            ->all();

        $dedupedNewSerials = collect($rawNewSerials)
            ->unique(fn ($serial) => mb_strtolower($serial))
            ->values()
            ->all();

        $payload = [
            'item_id' => $request->filled('item_id') ? (int) $request->input('item_id') : null,
            'supplier_id' => $request->filled('supplier_id') ? (int) $request->input('supplier_id') : null,
            'property_id' => $request->filled('property_id') ? (int) $request->input('property_id') : null,
            'location_id' => $request->filled('location_id') ? (int) $request->input('location_id') : null,
            'quantity' => $request->filled('quantity') ? (int) $request->input('quantity') : null,
            'rf_number' => filled($request->input('rf_number')) ? trim((string) $request->input('rf_number')) : null,
            'invoice_number' => filled($request->input('invoice_number')) ? trim((string) $request->input('invoice_number')) : null,
            'received_date' => $request->input('received_date'),
            'remarks' => filled($request->input('remarks')) ? trim((string) $request->input('remarks')) : null,
            'selected_asset_unit_ids' => $selectedIds,
            'raw_new_serial_numbers' => $rawNewSerials,
            'new_serial_numbers' => $dedupedNewSerials,
        ];

        $request->merge([
            'item_id' => $payload['item_id'],
            'supplier_id' => $payload['supplier_id'],
            'property_id' => $payload['property_id'],
            'location_id' => $payload['location_id'],
            'quantity' => $payload['quantity'],
            'rf_number' => $payload['rf_number'],
            'invoice_number' => $payload['invoice_number'],
            'received_date' => $payload['received_date'],
            'remarks' => $payload['remarks'],
            'selected_asset_unit_ids' => $payload['selected_asset_unit_ids'],
            'new_serial_numbers' => $payload['new_serial_numbers'],
        ]);

        return $payload;
    }

    // Validate stock-in fields, location ownership, serial uniqueness, and quantity count
    private function validateStockIn(Request $request, array $normalized): array
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:item_masterlist,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'location_id' => [
                'nullable',
                'integer',
                Rule::exists('locations', 'id')->where(function ($query) use ($normalized) {
                    if (!empty($normalized['property_id'])) {
                        $query->where('property_id', $normalized['property_id']);
                    }
                }),
            ],
            'quantity' => ['required', 'integer', 'min:1'],
            'rf_number' => ['required', 'string', 'max:100'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'received_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'selected_asset_unit_ids' => ['nullable', 'array'],
            'selected_asset_unit_ids.*' => [
                'integer',
                Rule::exists('asset_units', 'id')->where(function ($query) use ($normalized) {
                    $query->where('item_id', $normalized['item_id'])
                        ->where('status', 'Available')
                        ->whereNull('stock_in_log_id');
                }),
            ],
            'new_serial_numbers' => ['nullable', 'array'],
            'new_serial_numbers.*' => ['string', 'max:100'],
        ]);

        // Reject duplicate serials entered in the same submission
        $rawSerials = $normalized['raw_new_serial_numbers'] ?? [];
        if (count($rawSerials) !== count($validated['new_serial_numbers'] ?? [])) {
            throw ValidationException::withMessages([
                'new_serial_numbers' => ['Duplicate serial numbers were entered in the same stock-in.'],
            ]);
        }

        // Reject serial numbers that already exist in asset_units
        if (!empty($validated['new_serial_numbers'])) {
            $lowerSerials = array_map(fn ($s) => mb_strtolower($s), $validated['new_serial_numbers']);

            $existingSerials = DB::table('asset_units')
                ->whereIn(DB::raw('lower(trim(serial_number))'), $lowerSerials)
                ->pluck('serial_number')
                ->all();

            if (!empty($existingSerials)) {
                throw ValidationException::withMessages([
                    'new_serial_numbers' => [
                        'These serial numbers already exist in asset units: ' . implode(', ', $existingSerials),
                    ],
                ]);
            }
        }

        // Ensure quantity matches serial count whenever serial numbers are used
        $serialCount = count($validated['selected_asset_unit_ids'] ?? []) + count($validated['new_serial_numbers'] ?? []);
        if ($serialCount > 0 && (int) $validated['quantity'] !== $serialCount) {
            throw ValidationException::withMessages([
                'quantity' => ["Quantity must match the {$serialCount} serial number(s) selected or entered."],
            ]);
        }

        return $validated;
    }

    // Subtract quantity from property_inventory when editing or deleting a stock-in
    private function reversePropertyInventoryEffect(?int $propertyId, int $itemId, int $qty): void
    {
        if ($propertyId === null) {
            return;
        }

        $propStock = DB::table('property_inventory')
            ->where('property_id', $propertyId)
            ->where('item_id', $itemId)
            ->lockForUpdate()
            ->first();

        if (!$propStock || (int) $propStock->qty < $qty) {
            throw ValidationException::withMessages([
                'quantity' => ['Cannot modify or delete this stock-in because property inventory stock would go below zero.'],
            ]);
        }

        DB::table('property_inventory')
            ->where('property_id', $propertyId)
            ->where('item_id', $itemId)
            ->update([
                'qty' => DB::raw('qty - ' . $qty),
                'last_updated' => now(),
            ]);
    }

    // Upsert property_inventory quantity and shift rf_num to previous_rf_num when RF changes
    private function applyPropertyInventoryEffect(
        int $propertyId,
        int $itemId,
        int $qty,
        string $rfNumber,
        bool $updateRfNum = true
    ): void {
        if ($updateRfNum) {
            DB::statement(
                'INSERT INTO public.property_inventory (property_id, item_id, qty, rf_num, previous_rf_num, last_updated)
                 VALUES (?, ?, ?, ?, NULL, CURRENT_TIMESTAMP)
                 ON CONFLICT (property_id, item_id)
                 DO UPDATE SET
                     previous_rf_num = CASE
                         WHEN EXCLUDED.rf_num IS NOT NULL
                              AND public.property_inventory.rf_num IS DISTINCT FROM EXCLUDED.rf_num
                         THEN public.property_inventory.rf_num
                         ELSE public.property_inventory.previous_rf_num
                     END,
                     rf_num = COALESCE(EXCLUDED.rf_num, public.property_inventory.rf_num),
                     qty = public.property_inventory.qty + EXCLUDED.qty,
                     last_updated = CURRENT_TIMESTAMP',
                [$propertyId, $itemId, $qty, $rfNumber]
            );
        } else {
            DB::statement(
                'INSERT INTO public.property_inventory (property_id, item_id, qty, rf_num, previous_rf_num, last_updated)
                 VALUES (?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP)
                 ON CONFLICT (property_id, item_id)
                 DO UPDATE SET
                     qty = public.property_inventory.qty + EXCLUDED.qty,
                     last_updated = CURRENT_TIMESTAMP',
                [$propertyId, $itemId, $qty]
            );
        }
    }

    // Recompute rf_num and previous_rf_num from remaining stock_in_logs after a delete
    private function syncPropertyRfAfterDelete(?int $propertyId, int $itemId): void
    {
        if ($propertyId === null) {
            return;
        }

        $recentRfs = DB::table('stock_in_logs')
            ->where('property_id', $propertyId)
            ->where('item_id', $itemId)
            ->whereNotNull('rf_number')
            ->orderByDesc('received_date')
            ->orderByDesc('id')
            ->pluck('rf_number')
            ->filter(fn ($rf) => trim((string) $rf) !== '')
            ->unique()
            ->values();

        DB::table('property_inventory')
            ->where('property_id', $propertyId)
            ->where('item_id', $itemId)
            ->update([
                'rf_num' => $recentRfs->get(0),
                'previous_rf_num' => $recentRfs->get(1),
                'last_updated' => now(),
            ]);
    }

    // Fetch serial numbers linked to a stock-in record
    private function getStockInSerialNumbers(int $stockInId): array
    {
        return DB::table('asset_units')
            ->where('stock_in_log_id', $stockInId)
            ->orderBy('id')
            ->pluck('serial_number')
            ->filter()
            ->values()
            ->all();
    }

    // Format serial numbers without parentheses or duplicate "SN:" prefix
    private function formatSerialSuffix(array $serials): string
    {
        if (empty($serials)) {
            return '';
        }

        $formatted = array_map(function ($serial) {
            $clean = trim((string) $serial);
            // Omit "SN:" prefix if the serial already starts with "SN-" or "SN "
            if (preg_match('/^SN[-\s]/i', $clean)) {
                return $clean;
            }
            return 'SN: ' . $clean;
        }, $serials);

        return ' — ' . implode(', ', $formatted);
    }

    // Look up item name by ID
    private function getItemName(int $itemId): string
    {
        return DB::table('item_masterlist')
            ->where('id', $itemId)
            ->value('item_name') ?? "Item #{$itemId}";
    }

    // Look up property name by ID
    private function getLocationName(?int $propertyId): string
    {
        if ($propertyId === null) {
            return 'Central Warehouse';
        }

        return DB::table('properties')
            ->where('id', $propertyId)
            ->value('name') ?? "Property #{$propertyId}";
    }

    // Normalize RF display format for audit descriptions
    private function formatRfNumber(string $rfNumber): string
    {
        $trimmed = trim($rfNumber);
        if ($trimmed === '') {
            return 'RF #N/A';
        }

        $stripped = preg_replace('/^RF[-#\s]*/i', '', $trimmed);
        return 'RF #' . ($stripped !== '' ? $stripped : $trimmed);
    }

    // Write an audit log row for the current property stock-in action
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action_type' => $actionType,
            'table_name' => 'stock_in_logs',
            'record_id' => $recordId,
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}