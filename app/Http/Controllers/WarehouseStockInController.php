<?php

namespace App\Http\Controllers;

use App\Models\WarehouseStockin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WarehouseStockInController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $propertyFilter = $request->input('property_id');

        $stockInsQuery = WarehouseStockin::query()
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

        if ($search !== '') {
            $like = '%' . $search . '%';
            $stockInsQuery->where(function ($q) use ($like) {
                $q->where('stock_in_logs.rf_number', 'ilike', $like)
                    ->orWhere('stock_in_logs.invoice_number', 'ilike', $like)
                    ->orWhere('stock_in_logs.remarks', 'ilike', $like)
                    ->orWhere('im.item_name', 'ilike', $like)
                    ->orWhere('s.sku_code', 'ilike', $like)
                    ->orWhere('sup.name', 'ilike', $like);
            });
        }

        if ($propertyFilter === 'warehouse') {
            $stockInsQuery->whereNull('stock_in_logs.property_id');
        } elseif (!empty($propertyFilter) && is_numeric($propertyFilter)) {
            $stockInsQuery->where('stock_in_logs.property_id', (int) $propertyFilter);
        }

        $stockIns = $stockInsQuery
            ->orderByDesc('stock_in_logs.received_date')
            ->orderByDesc('stock_in_logs.id')
            ->paginate(5)
            ->withQueryString();

        $mainInventory = DB::table('main_inventory as mi')
            ->join('item_masterlist as im', 'mi.item_id', '=', 'im.id')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->leftJoin('uom as u', 'im.uom_id', '=', 'u.id')
            ->select([
                'mi.id',
                'mi.item_id',
                'mi.rf_num',
                'mi.previous_rf_num',
                'mi.stockin',
                'mi.stockout',
                'mi.qty',
                'mi.parstock',
                'im.item_name',
                'im.uom_id',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
                DB::raw("COALESCE(u.name, 'Unit') as uom_name"),
                'u.code as uom_code',
            ])
            ->orderBy('im.item_name')
            ->get();

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

        $suppliers = DB::table('suppliers')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $properties = DB::table('properties')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $lastSuppliers = DB::table('stock_in_logs as sil')
            ->join('suppliers as sup', 'sil.supplier_id', '=', 'sup.id')
            ->whereNotNull('sil.supplier_id')
            ->orderByDesc('sil.received_date')
            ->orderByDesc('sil.id')
            ->select([
                'sil.item_id',
                'sil.supplier_id',
                'sup.name as supplier_name',
                'sil.received_date',
            ])
            ->get()
            ->unique('item_id')
            ->keyBy('item_id');

        // Only unstocked units with status 'Available' and no stock_in_log_id can be selected for stock-in
        $availableAssetUnits = DB::table('asset_units as au')
            ->leftJoin('properties as p', 'au.property_id', '=', 'p.id')
            ->where('au.status', 'Available')
            ->whereNull('au.stock_in_log_id')
            ->select([
                'au.id',
                'au.item_id',
                'au.supplier_id',
                'au.property_id',
                'au.stock_in_log_id',
                'au.serial_number',
                'au.status',
                'au.date_received',
                'p.name as property_name',
            ])
            ->orderByDesc('au.id')
            ->get();

        return Inertia::render('Inventory/WarehouseStockIn', [
            'mainInventory' => $mainInventory,
            'stockIns' => $stockIns,
            'items' => $items,
            'suppliers' => $suppliers,
            'properties' => $properties,
            'assetUnits' => $availableAssetUnits,
            'lastSuppliers' => $lastSuppliers,
            'filters' => [
                'search' => $search,
                'property_id' => $propertyFilter,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $normalized = $this->normalizePayload($request);
        $validated = $this->validateStockIn($request, $normalized);

        DB::transaction(function () use ($validated) {
            $effectiveSupplierId = $this->resolveEffectiveSupplierId($validated);

            // trg_auto_stock_in automatically updates main_inventory or property_inventory on INSERT
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

            $this->syncAssetUnits($stockIn->id, $validated, $effectiveSupplierId);

            $this->writeAuditLog(
                actionType: 'STOCK_IN_CREATE',
                recordId: $stockIn->id,
                description: sprintf(
                    'Created stock-in #%d (item_id=%d, qty=%d, rf_number=%s, property_id=%s)',
                    $stockIn->id,
                    $validated['item_id'],
                    $validated['quantity'],
                    $validated['rf_number'],
                    $validated['property_id'] ?? 'NULL (Central Warehouse)'
                )
            );
        });

        return back()->with('success', 'Stock-in recorded successfully.');
    }

    public function update(Request $request, int $warehousestockin)
    {
        $stockIn = WarehouseStockin::findOrFail($warehousestockin);
        $normalized = $this->normalizePayload($request);
        $validated = $this->validateStockIn($request, $normalized);

        DB::transaction(function () use ($stockIn, $validated) {
            $oldPropertyId = $stockIn->property_id !== null ? (int) $stockIn->property_id : null;
            $oldItemId = (int) $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;
            $oldRfNumber = (string) $stockIn->rf_number;
            $stockInId = (int) $stockIn->id;

            $this->rollbackStockInAssetUnits($stockInId);
            $this->reverseInventoryEffect($oldPropertyId, $oldItemId, $oldQty);

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

            $isLatestWarehouseStockIn = is_null($validated['property_id'])
                && !DB::table('stock_in_logs')
                    ->where('item_id', $validated['item_id'])
                    ->whereNull('property_id')
                    ->where('id', '>', $stockInId)
                    ->exists();

            $this->applyInventoryEffect(
                propertyId: $validated['property_id'],
                itemId: $validated['item_id'],
                qty: $validated['quantity'],
                rfNumber: $validated['rf_number'],
                updateRfNum: $isLatestWarehouseStockIn
            );

            $this->syncAssetUnits($stockInId, $validated, $effectiveSupplierId);

            $this->writeAuditLog(
                actionType: 'STOCK_IN_UPDATE',
                recordId: $stockInId,
                description: sprintf(
                    'Updated stock-in #%d from [item=%d, qty=%d, rf=%s, prop=%s] to [item=%d, qty=%d, rf=%s, prop=%s]',
                    $stockInId,
                    $oldItemId,
                    $oldQty,
                    $oldRfNumber,
                    $oldPropertyId ?? 'NULL (Central Warehouse)',
                    $validated['item_id'],
                    $validated['quantity'],
                    $validated['rf_number'],
                    $validated['property_id'] ?? 'NULL (Central Warehouse)'
                )
            );
        });

        return back()->with('success', 'Stock-in updated successfully.');
    }

    public function destroy(int $warehousestockin)
    {
        $stockIn = WarehouseStockin::findOrFail($warehousestockin);

        DB::transaction(function () use ($stockIn) {
            $oldPropertyId = $stockIn->property_id !== null ? (int) $stockIn->property_id : null;
            $oldItemId = (int) $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;
            $oldRfNumber = (string) $stockIn->rf_number;
            $stockInId = (int) $stockIn->id;

            $this->rollbackStockInAssetUnits($stockInId);
            $this->reverseInventoryEffect($oldPropertyId, $oldItemId, $oldQty);
            $stockIn->delete();

            $this->writeAuditLog(
                actionType: 'STOCK_IN_DELETE',
                recordId: $stockInId,
                description: sprintf(
                    'Deleted stock-in #%d (item_id=%d, qty=%d, rf_number=%s, property_id=%s)',
                    $stockInId,
                    $oldItemId,
                    $oldQty,
                    $oldRfNumber,
                    $oldPropertyId ?? 'NULL (Central Warehouse)'
                )
            );
        });

        return back()->with('success', 'Stock-in deleted successfully.');
    }

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

    private function rollbackStockInAssetUnits(int $stockInId): void
    {
        $units = DB::table('asset_units')
            ->where('stock_in_log_id', $stockInId)
            ->lockForUpdate()
            ->get();

        foreach ($units as $unit) {
            if ($unit->status !== 'In Warehouse') {
                throw ValidationException::withMessages([
                    'quantity' => [
                        "Serial {$unit->serial_number} is already {$unit->status} and cannot be modified or removed.",
                    ],
                ]);
            }
        }

        // Release pre-existing units back to Available so they can be stocked in again if needed
        DB::table('asset_units')
            ->where('stock_in_log_id', $stockInId)
            ->update([
                'stock_in_log_id' => null,
                'property_id' => null,
                'status' => 'Available',
            ]);
    }

    private function syncAssetUnits(int $stockInId, array $validated, ?int $effectiveSupplierId): void
    {
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
                    'property_id' => $validated['property_id'],
                    'supplier_id' => DB::raw($supplierExpr),
                    'status' => 'In Warehouse',
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
                'status' => 'In Warehouse',
                'property_id' => $validated['property_id'],
                'date_received' => $validated['received_date'],
            ], $validated['new_serial_numbers']);

            DB::table('asset_units')->insert($rows);
        }
    }

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

    private function validateStockIn(Request $request, array $normalized): array
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:item_masterlist,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'rf_number' => [
                'required',
                'string',
                Rule::when(
                    is_null($normalized['property_id']),
                    ['max:25'],
                    ['max:100']
                ),
            ],
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

        $rawSerials = $normalized['raw_new_serial_numbers'] ?? [];
        if (count($rawSerials) !== count($validated['new_serial_numbers'] ?? [])) {
            throw ValidationException::withMessages([
                'new_serial_numbers' => ['Duplicate serial numbers were entered in the same stock-in.'],
            ]);
        }

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

        $serialCount = count($validated['selected_asset_unit_ids'] ?? []) + count($validated['new_serial_numbers'] ?? []);
        if ($serialCount > 0 && (int) $validated['quantity'] !== $serialCount) {
            throw ValidationException::withMessages([
                'quantity' => ["Quantity must match the {$serialCount} serial number(s) selected or entered."],
            ]);
        }

        return $validated;
    }

    private function reverseInventoryEffect(?int $propertyId, int $itemId, int $qty): void
    {
        if ($propertyId === null) {
            $main = DB::table('main_inventory')
                ->where('item_id', $itemId)
                ->lockForUpdate()
                ->first();

            if (!$main || (int) $main->qty < $qty) {
                throw ValidationException::withMessages([
                    'quantity' => ['Cannot modify or delete this stock-in because central warehouse stock would go below zero.'],
                ]);
            }

            DB::table('main_inventory')
                ->where('item_id', $itemId)
                ->update([
                    'stockin' => DB::raw('GREATEST(0, stockin - ' . $qty . ')'),
                    'qty' => DB::raw('qty - ' . $qty),
                    'last_updated' => now(),
                ]);
        } else {
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
                ]);
        }
    }

    private function applyInventoryEffect(
        ?int $propertyId,
        int $itemId,
        int $qty,
        string $rfNumber,
        bool $updateRfNum = true
    ): void {
        if ($propertyId === null) {
            if ($updateRfNum) {
                DB::statement(
                    'INSERT INTO public.main_inventory (previous_rf_num, rf_num, item_id, stockin, qty, last_updated)
                     VALUES (NULL, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                     ON CONFLICT (item_id)
                     DO UPDATE SET
                         previous_rf_num = public.main_inventory.rf_num,
                         rf_num = EXCLUDED.rf_num,
                         stockin = public.main_inventory.stockin + EXCLUDED.stockin,
                         qty = public.main_inventory.qty + EXCLUDED.qty,
                         last_updated = CURRENT_TIMESTAMP',
                    [$rfNumber, $itemId, $qty, $qty]
                );
            } else {
                DB::statement(
                    'INSERT INTO public.main_inventory (previous_rf_num, rf_num, item_id, stockin, qty, last_updated)
                     VALUES (NULL, NULL, ?, ?, ?, CURRENT_TIMESTAMP)
                     ON CONFLICT (item_id)
                     DO UPDATE SET
                         stockin = public.main_inventory.stockin + EXCLUDED.stockin,
                         qty = public.main_inventory.qty + EXCLUDED.qty,
                         last_updated = CURRENT_TIMESTAMP',
                    [$itemId, $qty, $qty]
                );
            }
        } else {
            DB::statement(
                'INSERT INTO public.property_inventory (property_id, item_id, qty)
                 VALUES (?, ?, ?)
                 ON CONFLICT (property_id, item_id)
                 DO UPDATE SET
                     qty = public.property_inventory.qty + EXCLUDED.qty',
                [$propertyId, $itemId, $qty]
            );
        }
    }

    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $user = Auth::user();
        if (!$user) {
            return;
        }

        $fullName = trim(($user->fname ?? '') . ' ' . ($user->lname ?? ''));
        $actorLabel = $fullName !== ''
            ? "{$fullName} (#{$user->id})"
            : ($user->email ?? "User #{$user->id}");

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action_type' => $actionType,
            'table_name' => 'stock_in_logs',
            'record_id' => $recordId,
            'description' => "{$description} — by {$actorLabel}",
        ]);
    }
}