<?php

namespace App\Providers;

use App\Models\AuditLogs;
use App\Models\ItemMasterlist;
use App\Observers\ItemMasterlistObserver;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Handle Successful Login Event
        Event::listen(Login::class, function ($event) {
            $user = $event->user;

            // Update last login details on the user table
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => request()->ip(),
            ]);

            // Record successful login in the audit_logs table
            AuditLogs::create([
                'user_id' => $user->id,
                'action_type' => 'LOGIN_SUCCESS',
                'table_name' => 'users',
                'record_id' => $user->id,
                'description' => 'User successfully logged in from IP:' . request()->ip(),
            ]);
        });

        // 2. Handle Failed Login Event
        Event::listen(Failed::class, function ($event) {
            // $event->credentials contains the submitted credentials (e.g., username/email)
            $attemptedEmail = $event->credentials['email'] ?? $event->credentials['username'] ?? 'Unknown';

            // Record failed login attempt in the audit_logs table
            AuditLogs::create([
                'user_id' => null,
                'action_type' => 'LOGIN_FAILED',
                'table_name' => 'users',
                'record_id' => null,
                'description' => 'Failed login attempt for user:' . $attemptedEmail . ' from IP:' . request()->ip(),
            ]);
        });

        // Keep item masterlist observer active; asset unit auditing is handled in AssetUnitController
        ItemMasterlist::observe(ItemMasterlistObserver::class);

        Vite::prefetch(concurrency: 3);
    }
}