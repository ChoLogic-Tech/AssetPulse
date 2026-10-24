<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['fname', 'lname', 'username', 'email', 'password_hash', 'role_id', 'property_id', 'status', 'created_at'])]
class Users extends Model
{
    //
}