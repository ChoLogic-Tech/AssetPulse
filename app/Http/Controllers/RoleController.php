<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller {

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        //If validation passes, laravel will triggers Eloquent via 
        Role::create($validated); 

        return redirect()->back()->with('success', 'Role successfully created.');
    }

    //index or get function to fetch data in PostgreSQL
    public function index()
    {
        // 1. Fetch all rows from PostgreSQL via Eloquent
        $roles = Role::orderBy('id', 'asc')->get();

        // 2. Send data to the React component as the 'roles' prop
        return Inertia::render('Settings/RolesAndPermissions', [
            'roles' => $roles,
        ]);
    }

    // 3. UPDATE: Modify an existing role
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:50|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($validated);

        return redirect()->back()->with('success', 'Role successfully updated.');
    }

    // 4. DELETE: Remove a role from the database
    public function destroy(Role $role)
    {
        try {
            $role->delete();

            return redirect()->back()->with('success', 'Role successfully deleted.');
        } catch (\Illuminate\Database\QueryException $e) {
            // PostgreSQL foreign key violation error code
            if ($e->getCode() === '23503') {
                return redirect()->back()->with('error', 'Cannot delete this role because it is still assigned to active users.');
            }

            // Re-throw if it's a different database error
            throw $e;
        }
    }

    
}
