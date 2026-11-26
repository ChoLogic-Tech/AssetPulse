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
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $propertyFilter = $request->input('property_id');

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

        if (!empty($propertyFilter) && is_numeric($propertyFilter)) {
            $stockInsQuery->where('stock_in_logs.property_id', (int) $propertyFilter);
        }

        $stockIns = $stockInsQuery
            ->orderByDesc('stock_in_logs.received_date')
            ->orderByDesc('stock_in_logs.id')
            ->paginate(5)
            ->withQueryString();

        $items = DB::table('item_masterlist as im')
            ->leftJoin('sku as s', 'im.sku_id', '=', 's.id')
            ->select([
                'im.id',
                'im.item_name',
                DB::raw("COALESCE(s.sku_code, 'NO-SKU') as sku"),
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

        $serializedUnits = DB::table('asset_units as au')
            ->leftJoin('properties as p', 'au.property_id', '=', 'p.id')
            ->select([
                'au.id',
                'au.item_id',
                'au.supplier_id',
                'au.property_id',
                'au.serial_number',
                'au.status',
                'au.date_received',
                'p.name as property_name',
            ])
            ->orderByDesc('au.id')
            ->get();

        return Inertia::render('Inventory/PropertyStockIn', [
            'stockIns' => $stockIns,
            'items' => $items,
            'suppliers' => $suppliers,
            'properties' => $properties,
            'assetUnits' => $serializedUnits,
            'filters' => [
                'search' => $search,
                'property_id' => $propertyFilter,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $normalized = $this->normalizePayload($request);
        $validated = $this->validatePropertyStockIn($request, $normalized);

        DB::transaction(function () use ($validated) {
            $stockIn = WarehouseStockin::create([
                'item_id' => $validated['item_id'],
                'supplier_id' => $validated['supplier_id'],
                'property_id' => $validated['property_id'],
                'received_by' => Auth::id(),
                'quantity' => $validated['quantity'],
                'rf_number' => $validated['rf_number'],
                'invoice_number' => $validated['invoice_number'],
                'received_date' => $validated['received_date'],
                'remarks' => $validated['remarks'],
            ]);

            $this->syncAssetUnits($validated);

            $this->writeAuditLog(
                actionType: 'PROPERTY_STOCK_IN_CREATE',
                recordId: $stockIn->id,
                description: sprintf(
                    'Created property stock-in #%d (property_id=%d, item_id=%d, qty=%d, rf_number=%s)',
                    $stockIn->id,
                    $validated['property_id'],
                    $validated['item_id'],
                    $validated['quantity'],
                    $validated['rf_number']
                )
            );
        });

        return back()->with('success', 'Property stock-in recorded successfully.');
    }

    public function update(Request $request, int $stock_in)
    {
        $stockIn = WarehouseStockin::whereNotNull('property_id')->findOrFail($stock_in);
        $normalized = $this->normalizePayload($request);
        $validated = $this->validatePropertyStockIn($request, $normalized);

        DB::transaction(function () use ($stockIn, $validated) {
            $oldPropertyId = $stockIn->property_id;
            $oldItemId = $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;

            $this->reversePropertyInventory($oldPropertyId, $oldItemId, $oldQty);

            $stockIn->update([
                'item_id' => $validated['item_id'],
                'supplier_id' => $validated['supplier_id'],
                'property_id' => $validated['property_id'],
                'quantity' => $validated['quantity'],
                'rf_number' => $validated['rf_number'],
                'invoice_number' => $validated['invoice_number'],
                'received_date' => $validated['received_date'],
                'remarks' => $validated['remarks'],
            ]);

            $this->applyPropertyInventory(
                propertyId: $validated['property_id'],
                itemId: $validated['item_id'],
                qty: $validated['quantity']
            );

            $this->syncAssetUnits($validated);

            $this->writeAuditLog(
                actionType: 'PROPERTY_STOCK_IN_UPDATE',
                recordId: $stockIn->id,
                description: sprintf(
                    'Updated property stock-in #%d (property_id=%d, item_id=%d, qty=%d, rf_number=%s)',
                    $stockIn->id,
                    $validated['property_id'],
                    $validated['item_id'],
                    $validated['quantity'],
                    $validated['rf_number']
                )
            );
        });

        return back()->with('success', 'Property stock-in updated successfully.');
    }

    public function destroy(int $stock_in)
    {
        $stockIn = WarehouseStockin::whereNotNull('property_id')->findOrFail($stock_in);

        DB::transaction(function () use ($stockIn) {
            $oldPropertyId = $stockIn->property_id;
            $oldItemId = $stockIn->item_id;
            $oldQty = (int) $stockIn->quantity;
            $stockInId = $stockIn->id;

            $this->reversePropertyInventory($oldPropertyId, $oldItemId, $oldQty);
            $stockIn->delete();

            $this->writeAuditLog(
                actionType: 'PROPERTY_STOCK_IN_DELETE',
                recordId: $stockInId,
                description: sprintf(
                    'Deleted property stock-in #%d (property_id=%d, item_id=%d, qty=%d, rf_number=%s)',
                    $stockInId,
                    $oldPropertyId,
                    $oldItemId,
                    $oldQty,
                    $stockIn->rf_number
                )
            );
        });

        return back()->with('success', 'Property stock-in deleted successfully.');
    }

    private function syncAssetUnits(array $validated): void
    {
        if (!empty($validated['selected_asset_unit_ids'])) {
            DB::table('asset_units')
                ->whereIn('id', $validated['selected_asset_unit_ids'])
                ->where('item_id', $validated['item_id'])
                ->update([
                    'property_id' => $validated['property_id'],
                    'supplier_id' => $validated['supplier_id'],
                    'date_received' => $validated['received_date'],
                ]);
        }

        if (!empty($validated['new_serial_numbers'])) {
            $rows = array_map(fn ($serial) => [
                'item_id' => $validated['item_id'],
                'supplier_id' => $validated['supplier_id'],
                'serial_number' => $serial,
                'status' => 'Available',
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

        $newSerials = collect($request->input('new_serial_numbers', []))
            ->map(fn ($serial) => trim((string) $serial))
            ->filter()
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
            'new_serial_numbers' => $newSerials,
        ];

        $request->merge($payload);

        return $payload;
    }

    private function validatePropertyStockIn(Request $request, array $normalized): array
    {
        $validated = $request->validate([
            'item_id' => ['required', 'integer', 'exists:item_masterlist,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'rf_number' => ['required', 'string', 'max:25'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'received_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'selected_asset_unit_ids' => ['nullable', 'array'],
            'selected_asset_unit_ids.*' => [
                'integer',
                Rule::exists('asset_units', 'id')->where(function ($query) use ($normalized) {
                    $query->where('item_id', $normalized['item_id'])
                        ->where('status', 'Available');
                }),
            ],
            'new_serial_numbers' => ['nullable', 'array'],
            'new_serial_numbers.*' => ['string', 'max:100'],
        ]);

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

    private function reversePropertyInventory(int $propertyId, int $itemId, int $qty): void
    {
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

    private function applyPropertyInventory(int $propertyId, int $itemId, int $qty): void
    {
        DB::statement(
            'INSERT INTO public.property_inventory (property_id, item_id, qty)
             VALUES (?, ?, ?)
             ON CONFLICT (property_id, item_id)
             DO UPDATE SET
                 qty = public.property_inventory.qty + EXCLUDED.qty',
            [$propertyId, $itemId, $qty]
        );
    }

    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        if (!Auth::check()) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action_type' => $actionType,
            'table_name' => 'stock_in_logs',
            'record_id' => $recordId,
            'description' => $description,
        ]);
    }
}