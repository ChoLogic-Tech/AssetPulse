<?php

namespace App\Models;

// 1. Correct import for authentication
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class Users extends Authenticatable
{
    use HasFactory, Notifiable;

    // Explicitly define table name since class name is plural 'Users'
    protected $table = 'users';

    // Disable updated_at since your users table only has created_at
    public $timestamps = false;

    //Add 'role_name' here so Laravel includes it in JSON/Inertia props automatically
    protected $appends = ['role_name', 'property_name']; // Eager load relationships to avoid N+1 queries

    protected $fillable = [
        'fname', 
        'lname', 
        'username', 
        'email', 
        'password',    // 2. Changed from password_hash to match standard auth
        'role_id', 
        'property_id', 
        'status',      // 3. Changed from status_id to match your database schema column name
        'created_at',
        'last_login_at',  // <-- Add this
        'last_login_ip'   // <-- Add this
    ];

    protected $hidden = [
        'password',
    ];

    // --- Relationships ---

    // 1. User belongs to ONE Role (Matches 'role_id')
    public function role() {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    // 2. User belongs to ONE Property (Matches 'property_id')
    public function property() {
        return $this->belongsTo(Properties::class, 'property_id', 'id');
    }

    // 3. User belongs to ONE Status (Matches 'status' column in users table)
    public function status() {
        return $this->belongsTo(Status::class, 'status');
    }

    // --- Accessor ---

    // 2. This dynamically computes the role name whenever $user->role_name is accessed
    public function getRoleNameAttribute()
    {
        return $this->role ? $this->role->name : 'User';
    }

    // Dynamically computes property_name (defaults to null if no property exists)
    public function getPropertyNameAttribute()
    {
        return $this->property ? $this->property->name : 'No Property';
    }
}