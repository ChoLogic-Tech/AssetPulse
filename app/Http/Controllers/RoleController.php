<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RoleController extends Controller
{
    // Fetch all roles ordered by ID for the Roles & Permissions page
    public function index()
    {
        $roles = Role::orderBy('id', 'asc')->get();

        return Inertia::render('Settings/RolesAndPermissions', [
            'roles' => $roles,
        ]);
    }

    // Create a new role and record an audit log entry
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:50', 'unique:roles,name'],
            'description' => ['nullable', 'string'],
        ], [
            'name.required' => 'Role name is required.',
            'name.unique'   => 'A role with this name already exists.',
            'name.max'      => 'Role name must not exceed 50 characters.',
        ]);

        DB::transaction(function () use ($validated) {
            // Create the role record
            $role = Role::create([
                'name'        => trim($validated['name']),
                'description' => isset($validated['description']) ? trim($validated['description']) : null,
            ]);

            // Record role creation in audit logs
            $this->writeAuditLog(
                actionType: 'ROLE_CREATE',
                recordId: (int) $role->id,
                description: sprintf('Created role %s', $role->name)
            );
        });

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    // Update an existing role and record an audit log entry
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:50', 'unique:roles,name,' . $role->id],
            'description' => ['nullable', 'string'],
        ], [
            'name.required' => 'Role name is required.',
            'name.unique'   => 'A role with this name already exists.',
            'name.max'      => 'Role name must not exceed 50 characters.',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $oldName = (string) $role->name;
            $newName = trim($validated['name']);

            // Update the role record
            $role->update([
                'name'        => $newName,
                'description' => isset($validated['description']) ? trim($validated['description']) : null,
            ]);

            // Record role update in audit logs
            $logDescription = $oldName !== $newName
                ? sprintf('Updated role %s -> %s', $oldName, $newName)
                : sprintf('Updated role %s', $newName);

            $this->writeAuditLog(
                actionType: 'ROLE_UPDATE',
                recordId: (int) $role->id,
                description: $logDescription
            );
        });

        return redirect()->back()->with('success', 'Role updated successfully.');
    }

    // Delete a role if not in use, or return a clear validation error message
    public function destroy(Role $role)
    {
        try {
            DB::transaction(function () use ($role) {
                $roleId = (int) $role->id;
                $roleName = (string) $role->name;

                // Show a clear message when users are still assigned to this role
                $assignedUsersCount = (int) DB::table('users')
                    ->where('role_id', $roleId)
                    ->count();

                if ($assignedUsersCount > 0) {
                    $userLabel = $assignedUsersCount === 1 ? 'user' : 'users';

                    throw ValidationException::withMessages([
                        'role' => [
                            "Cannot delete {$roleName} because it is assigned to {$assignedUsersCount} {$userLabel}.",
                        ],
                    ]);
                }

                $role->delete();

                // Record role deletion in audit logs
                $this->writeAuditLog(
                    actionType: 'ROLE_DELETE',
                    recordId: $roleId,
                    description: sprintf('Deleted role %s', $roleName)
                );
            });

            return redirect()->back()->with('success', 'Role deleted successfully.');
        } catch (QueryException $e) {
            // Catch PostgreSQL foreign key violations (23503) and return a readable message
            if ($e->getCode() === '23503') {
                throw ValidationException::withMessages([
                    'role' => [
                        "Cannot delete {$role->name} because it is still referenced by existing records.",
                    ],
                ]);
            }

            throw $e;
        }
    }

    // Write an audit log entry for role management actions
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $actor = Auth::user();
        if (!$actor) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id'     => $actor->id,
            'action_type' => $actionType,
            'table_name'  => 'roles',
            'record_id'   => $recordId,
            'description' => $description,
            'created_at'  => now(),
        ]);
    }
}