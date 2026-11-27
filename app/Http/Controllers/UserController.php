<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Property;
use App\Models\Status;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index() {

        return Inertia::render('Settings/Users', [
            'users'      => User::orderBy('role_id', 'asc')->get(),
            'roles'      => Role::all(),
            'properties' => Property::all(),
            'status'   => Status::all(),
        ]);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'fname' => ['required', 'string', 'max:25'],
            'lname' => ['required', 'string', 'max:25'],
            'username' => ['required', 'string', 'max:20', 'unique:users'],
            'email' => ['required', 'string', 'max:20', 'unique:users'],
            'role_id' =>['required', 'exists:roles,id'],
            'property_id' => ['required', 'exists:properties,id'],
            'status' => ['required'],

            'password' => [
                'required',
                'string',
                Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols(),
            ],
        ]);

        User::create([
            'fname' => $validated['fname'],
            'lname' => $validated['lname'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']), 
            'role_id' => $validated['role_id'],
            'property_id' => $validated['property_id'],
            'user_status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user) {

        $validated = $request->validate([
            'fname'       => ['required', 'string', 'max:255'],
            'lname'       => ['required', 'string', 'max:255'],
            // Ignore the current user's ID so unique validation doesn't fail on their own username/email
            'username'    => ['required', 'string', 'max:255', 'unique:users,username,' . $user->id],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role_id'     => ['required'],
            'property_id' => ['required'],
            'status' => ['required', 'string', 'in:Active,Inactive'],

            // Password is optional on update
            'password' => [
                'nullable',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        // Prepare data to update
        $userData = [
            'fname'       => $validated['fname'],
            'lname'       => $validated['lname'],
            'username'    => $validated['username'],
            'email'       => $validated['email'],
            'role_id'     => $validated['role_id'],
            'property_id' => $validated['property_id'],
            'user_status' => $validated['status'],
        ];

        // Only hash and update the password if a new one was provided
        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        return redirect()->back()->with('success', 'User updated successfully.');
    }
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->back()->with('success', 'User successfully deleted.');
    }
}