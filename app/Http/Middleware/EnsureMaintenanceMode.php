<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        $maintenanceEnabled = filter_var(
            config('app.maintenance_mode', false),
            FILTER_VALIDATE_BOOLEAN
        );

        if (! $maintenanceEnabled) {
            return $next($request);
        }

        // Allow logout, the dedicated maintenance login page, and login form submission (POST /login)
        // while blocking direct GET /login visits during maintenance
        if (
            $request->is('logout')
            || $request->is('maintenance-login')
            || ($request->is('login') && $request->isMethod('post'))
        ) {
            return $next($request);
        }

        $user = $request->user();

        if ($user instanceof User && $this->isAuthorizedDuringMaintenance($user)) {
            return $next($request);
        }

        if ($user) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return Inertia::render('Maintenance', [
            'message' => 'Scheduled system maintenance is currently in progress. Only Super Admin and authorized users can sign in right now.',
        ])->toResponse($request)->setStatusCode(503);
    }

    private function isAuthorizedDuringMaintenance(User $user): bool
    {
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