<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'roles';

    // Disable Laravel's automatic created_at and updated_at handling if not in schema
    public $timestamps = false; 

    protected $fillable = [
        'name',
        'description',
    ];
}
