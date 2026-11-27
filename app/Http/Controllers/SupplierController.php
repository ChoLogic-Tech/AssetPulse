<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    // Load suppliers ordered by name with distinct associated item counts across stock-in logs and asset units
    public function index()
    {
        $suppliers = Supplier::query()
            ->select('suppliers.*')
            // Count unique item_ids per supplier across both stock_in_logs and asset_units
            ->selectSub(
                DB::table(
                    DB::raw('(
                        SELECT item_id, supplier_id
                        FROM stock_in_logs
                        WHERE supplier_id IS NOT NULL AND item_id IS NOT NULL
                        UNION
                        SELECT item_id, supplier_id
                        FROM asset_units
                        WHERE supplier_id IS NOT NULL AND item_id IS NOT NULL
                    ) as supplier_items')
                )
                    ->selectRaw('COUNT(DISTINCT item_id)')
                    ->whereColumn('supplier_items.supplier_id', 'suppliers.id'),
                'items_count'
            )
            ->orderBy('name', 'ASC')
            ->get();

        return Inertia::render('MasterData/Suppliers', [
            'suppliers' => $suppliers,
        ]);
    }

    // Validate and create a new supplier record
    public function store(Request $request)
    {
        $trimmedName = trim((string) $request->input('name'));
        $lowerName = mb_strtolower($trimmedName);
        $cleanedPhone = preg_replace('/[\s\-()]/', '', (string) $request->input('phone_number'));

        $request->merge([
            'name' => $trimmedName,
            'phone_number' => $cleanedPhone,
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers', 'name')->where(function ($query) use ($lowerName) {
                    $query->whereRaw('LOWER(TRIM(name)) = ?', [$lowerName]);
                }),
            ],
            'contact_person' => ['required', 'string', 'max:100'],
            'phone_number' => [
                'required',
                'string',
                'max:50',
                'regex:/^(?:\+63|0)(?:9\d{9}|2\d{8}|[3-9]\d{8})$/',
            ],
            'email' => ['required', 'email', 'max:100'],
            'address' => ['required', 'string'],
        ], [
            'name.required' => 'Vendor/Supplier name is required.',
            'name.max' => 'Vendor/Supplier name must not exceed 100 characters.',
            'name.unique' => 'Supplier already exists.',
            'contact_person.required' => 'Contact person is required.',
            'contact_person.max' => 'Contact person must not exceed 100 characters.',
            'phone_number.required' => 'Contact number is required.',
            'phone_number.regex' => 'Enter a valid mobile number (+639 2130 18712 / 09XX XXX XXXX) or landline (+63 36 288 1234 / 036 288 1234).',
            'email.required' => 'Email address is required.',
            'email.email' => 'Enter a valid email address.',
            'address.required' => 'Supplier address is required.',
        ]);

        try {
            Supplier::create($validated);
        } catch (UniqueConstraintViolationException $e) {
            return back()
                ->withInput()
                ->withErrors(['name' => 'Supplier already exists.']);
        }

        return redirect()->back()->with('success', 'Supplier successfully created.');
    }

    // Validate and update an existing supplier record
    public function update(Request $request, Supplier $supplier)
    {
        $trimmedName = trim((string) $request->input('name'));
        $lowerName = mb_strtolower($trimmedName);
        $cleanedPhone = preg_replace('/[\s\-()]/', '', (string) $request->input('phone_number'));

        $request->merge([
            'name' => $trimmedName,
            'phone_number' => $cleanedPhone,
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers', 'name')
                    ->ignore($supplier->id)
                    ->where(function ($query) use ($lowerName) {
                        $query->whereRaw('LOWER(TRIM(name)) = ?', [$lowerName]);
                    }),
            ],
            'contact_person' => ['required', 'string', 'max:100'],
            'phone_number' => [
                'required',
                'string',
                'max:50',
                'regex:/^(?:\+63|0)(?:9\d{9}|2\d{8}|[3-9]\d{8})$/',
            ],
            'email' => ['required', 'email', 'max:100'],
            'address' => ['required', 'string'],
        ], [
            'name.required' => 'Vendor/Supplier name is required.',
            'name.max' => 'Vendor/Supplier name must not exceed 100 characters.',
            'name.unique' => 'Supplier already exists.',
            'contact_person.required' => 'Contact person is required.',
            'contact_person.max' => 'Contact person must not exceed 100 characters.',
            'phone_number.required' => 'Contact number is required.',
            'phone_number.regex' => 'Enter a valid mobile number (+639 2130 18712 / 09XX XXX XXXX) or landline (+63 36 288 1234 / 036 288 1234).',
            'email.required' => 'Email address is required.',
            'email.email' => 'Enter a valid email address.',
            'address.required' => 'Supplier address is required.',
        ]);

        try {
            $supplier->update($validated);
        } catch (UniqueConstraintViolationException $e) {
            return back()
                ->withInput()
                ->withErrors(['name' => 'Supplier already exists.']);
        }

        return redirect()->back()->with('success', 'Supplier successfully updated.');
    }

    // Delete a supplier unless PostgreSQL foreign key constraints prevent deletion
    public function destroy(Supplier $supplier)
    {
        try {
            $supplier->delete();
        } catch (QueryException $e) {
            if (($e->errorInfo[0] ?? null) === '23503') {
                return redirect()->back()->withErrors([
                    'delete' => 'Cannot delete supplier because it is referenced by existing records.',
                ]);
            }

            throw $e;
        }

        return redirect()->back()->with('success', 'Supplier successfully deleted.');
    }
}