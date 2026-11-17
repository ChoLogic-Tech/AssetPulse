<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Explicitly define table name
    protected $table = 'users';

    // Enable created_at while disabling updated_at (since table only has created_at)
    public $timestamps = true;
    const UPDATED_AT = null;

    // Automatically append accessors to JSON / Inertia responses
    protected $appends = ['role_name', 'property_name'];

    protected $fillable = [
        'fname', 
        'lname', 
        'username', 
        'email', 
        'password',
        'role_id', 
        'property_id', 
        'user_status',
        'created_at',
        'last_login_at',
        'last_login_ip'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- Relationships ---

    public function role() 
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    public function property() 
    {
        return $this->belongsTo(Property::class, 'property_id', 'id');
    }

    // --- Accessors ---

    public function getRoleNameAttribute()
    {
        return $this->role ? $this->role->name : 'Staff';
    }

    public function getPropertyNameAttribute()
    {
        return $this->property ? $this->property->name : 'Central Office';
    }
}