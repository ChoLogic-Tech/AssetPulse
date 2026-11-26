<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        if ($this->isMaintenanceModeEnabled()) {
            $loginInput = (string) ($request->input('login') ?? $request->input('email'));
            $fieldType = filter_var($loginInput, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
            $user = User::where($fieldType, $loginInput)->first();

            if (! $this->isUserAllowedDuringMaintenance($user)) {
                throw ValidationException::withMessages([
                    'login' => 'System is under maintenance. Only Super Admin and authorized users can sign in right now.',
                ]);
            }
        }

        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function isMaintenanceModeEnabled(): bool
    {
        return filter_var(
            config('app.maintenance_mode', false),
            FILTER_VALIDATE_BOOLEAN
        );
    }

    private function isUserAllowedDuringMaintenance(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        // Only role_id = 1 (Super Admin) is allowed by role
        $allowedRoleIds = [1];
        if (isset($user->role_id) && in_array((int) $user->role_id, $allowedRoleIds, true)) {
            return true;
        }

        $rawEmails = (string) config('app.maintenance_allowed_emails', '');
        $allowedEmails = array_filter(array_map('trim', explode(',', $rawEmails)));

        return ! empty($user->email) && in_array($user->email, $allowedEmails, true);
    }
}