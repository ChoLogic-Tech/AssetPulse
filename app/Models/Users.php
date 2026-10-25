<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Users extends Model
{
    // Standard Laravel property (No imports needed for this!)
    protected $fillable = [
        'fname', 
        'lname', 
        'username', 
        'email', 
        'password_hash', 
        'role_id', 
        'property_id', 
        'status_id', 
        'created_at'
    ];

    // 1. User belongs to ONE Role (Matches 'role_id')
    public function role() {
        return $this->belongsTo(Roles::class, 'role_id');
    }

    // 2. User belongs to ONE Property (Matches 'property_id')
    public function property() {
        return $this->belongsTo(Properties::class, 'property_id');
    }

    // 3. User belongs to ONE Status (Matches 'status' column)
    public function status() {
        return $this->belongsTo(Status::class, 'status_id');
    }
}