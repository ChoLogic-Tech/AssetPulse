<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PropertyController extends Controller
{
    // Load properties and user assignment counts for the Property Assignments page
    public function index()
    {
        $properties = DB::table('properties as prop')
            ->leftJoin('users as u', 'u.property_id', '=', 'prop.id')
            ->select([
                'prop.id',
                'prop.name',
                DB::raw('COUNT(u.id) as assigned_users_count'),
            ])
            ->groupBy('prop.id', 'prop.name')
            ->orderBy('prop.name')
            ->get();

        $users = DB::table('users as u')
            ->leftJoin('properties as prop', 'u.property_id', '=', 'prop.id')
            ->select([
                'u.id',
                'u.fname',
                'u.lname',
                'u.username',
                'u.email',
                'u.property_id',
                'prop.name as property_name',
            ])
            ->orderBy('u.fname')
            ->orderBy('u.lname')
            ->get();

        // Render Pages/Settings/Properties.jsx
        return Inertia::render('Settings/Properties', [
            'properties' => $properties,
            'users' => $users,
        ]);
    }

    // Create a new property and record an audit log entry
    public function store(Request $request)
    {
        $normalized = $this->normalizePayload($request);
        $validated = $this->validateProperty($request, $normalized);

        DB::transaction(function () use ($validated) {
            $propertyId = (int) DB::table('properties')->insertGetId([
                'name' => $validated['name'],
            ]);

            $this->writeAuditLog(
                actionType: 'PROPERTY_CREATE',
                recordId: $propertyId,
                description: sprintf(
                    'Created property %s',
                    $validated['name']
                )
            );
        });

        return back()->with('success', 'Property created successfully.');
    }

    // Update an existing property and record an audit log entry
    public function update(Request $request, int $property)
    {
        $existing = DB::table('properties')
            ->where('id', $property)
            ->lockForUpdate()
            ->first();

        abort_unless($existing !== null, 404);

        $normalized = $this->normalizePayload($request);
        $validated = $this->validateProperty($request, $normalized, (int) $existing->id);

        DB::transaction(function () use ($existing, $validated) {
            $propertyId = (int) $existing->id;
            $oldName = (string) $existing->name;
            $newName = (string) $validated['name'];

            DB::table('properties')
                ->where('id', $propertyId)
                ->update([
                    'name' => $newName,
                ]);

            $this->writeAuditLog(
                actionType: 'PROPERTY_UPDATE',
                recordId: $propertyId,
                description: sprintf(
                    'Updated property %s -> %s',
                    $oldName,
                    $newName
                )
            );
        });

        return back()->with('success', 'Property updated successfully.');
    }

    // Delete a property if no dependent records reference it, and record an audit log entry
    public function destroy(int $property)
    {
        $existing = DB::table('properties')
            ->where('id', $property)
            ->lockForUpdate()
            ->first();

        abort_unless($existing !== null, 404);

        DB::transaction(function () use ($existing) {
            $propertyId = (int) $existing->id;
            $propertyName = (string) $existing->name;

            // Show a clear message when the property is still assigned to one or more users
            $assignedUsersCount = (int) DB::table('users')
                ->where('property_id', $propertyId)
                ->count();

            if ($assignedUsersCount > 0) {
                $userLabel = $assignedUsersCount === 1 ? 'user' : 'users';

                throw ValidationException::withMessages([
                    'property' => [
                        "Cannot delete {$propertyName} because it is assigned to {$assignedUsersCount} {$userLabel}.",
                    ],
                ]);
            }

            // Guard against deleting properties that still reference inventory, stock-in logs, or asset units
            $hasInventory = DB::table('property_inventory')
                ->where('property_id', $propertyId)
                ->exists();

            $hasStockLogs = DB::table('stock_in_logs')
                ->where('property_id', $propertyId)
                ->exists();

            $hasAssetUnits = DB::table('asset_units')
                ->where('property_id', $propertyId)
                ->exists();

            if ($hasInventory || $hasStockLogs || $hasAssetUnits) {
                throw ValidationException::withMessages([
                    'property' => [
                        "Cannot delete {$propertyName} because it is still referenced by property inventory, stock-in logs, or asset units.",
                    ],
                ]);
            }

            DB::table('properties')
                ->where('id', $propertyId)
                ->delete();

            $this->writeAuditLog(
                actionType: 'PROPERTY_DELETE',
                recordId: $propertyId,
                description: sprintf(
                    'Deleted property %s',
                    $propertyName
                )
            );
        });

        return back()->with('success', 'Property deleted successfully.');
    }

    // Normalize incoming property form fields before validation
    private function normalizePayload(Request $request): array
    {
        $payload = [
            'name' => filled($request->input('name')) ? trim((string) $request->input('name')) : null,
        ];

        $request->merge([
            'name' => $payload['name'],
        ]);

        return $payload;
    }

    // Validate property fields and enforce case-insensitive uniqueness on name
    private function validateProperty(Request $request, array $normalized, ?int $ignoreId = null): array
    {
        $uniqueRule = Rule::unique('properties', 'name')
            ->where(fn ($query) => $query->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower((string) ($normalized['name'] ?? ''))]));

        if ($ignoreId !== null) {
            $uniqueRule = $uniqueRule->ignore($ignoreId);
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:150', $uniqueRule],
        ]);
    }

    // Write an audit log row for the current property action
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $user = Auth::user();
        if (!$user) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action_type' => $actionType,
            'table_name' => 'properties',
            'record_id' => $recordId,
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}