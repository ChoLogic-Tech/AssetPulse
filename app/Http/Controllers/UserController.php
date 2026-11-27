<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Users', [
            'users'      => User::orderBy('role_id', 'asc')->get(),
            'roles'      => Role::all(),
            'properties' => Property::all(),
            'status'     => Status::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname'       => ['required', 'string', 'max:25'],
            'lname'       => ['required', 'string', 'max:25'],
            'username'    => ['required', 'string', 'max:20', 'unique:users'],
            'email'       => ['required', 'string', 'max:20', 'unique:users'],
            'role_id'     => ['required', 'exists:roles,id'],
            'property_id' => ['required', 'exists:properties,id'],
            'status'      => ['required'],

            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        DB::transaction(function () use ($validated) {
            // Create the new user record
            $user = User::create([
                'fname'       => $validated['fname'],
                'lname'       => $validated['lname'],
                'username'    => $validated['username'],
                'email'       => $validated['email'],
                'password'    => Hash::make($validated['password']),
                'role_id'     => $validated['role_id'],
                'property_id' => $validated['property_id'],
                'user_status' => $validated['status'],
            ]);

            $fullName = trim($user->fname . ' ' . $user->lname);

            // Record user creation in audit logs
            $this->writeAuditLog(
                actionType: 'USER_CREATE',
                recordId: (int) $user->id,
                description: sprintf('Created user %s with username %s', $fullName, $user->username)
            );
        });

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'fname'       => ['required', 'string', 'max:255'],
            'lname'       => ['required', 'string', 'max:255'],
            // Ignore the current user's ID so unique validation doesn't fail on their own username/email
            'username'    => ['required', 'string', 'max:255', 'unique:users,username,' . $user->id],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role_id'     => ['required'],
            'property_id' => ['required'],
            'status'      => ['required', 'string', 'in:Active,Inactive'],

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

        DB::transaction(function () use ($user, $validated) {
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

            $fullName = trim($user->fname . ' ' . $user->lname);

            // Record user update in audit logs
            $this->writeAuditLog(
                actionType: 'USER_UPDATE',
                recordId: (int) $user->id,
                description: sprintf('Updated user %s with username %s', $fullName, $user->username)
            );
        });

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        DB::transaction(function () use ($user) {
            $userId = (int) $user->id;
            $fullName = trim($user->fname . ' ' . $user->lname);
            $username = (string) $user->username;

            $user->delete();

            // Record user deletion in audit logs
            $this->writeAuditLog(
                actionType: 'USER_DELETE',
                recordId: $userId,
                description: sprintf('Deleted user %s with username %s', $fullName, $username)
            );
        });

        return redirect()->back()->with('success', 'User successfully deleted.');
    }

    // Write an audit log entry for user management actions
    private function writeAuditLog(string $actionType, int $recordId, string $description): void
    {
        $actor = Auth::user();
        if (!$actor) {
            return;
        }

        DB::table('audit_logs')->insert([
            'user_id'     => $actor->id,
            'action_type' => $actionType,
            'table_name'  => 'users',
            'record_id'   => $recordId,
            'description' => $description,
            'created_at'  => now(),
        ]);
    }
}