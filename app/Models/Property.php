<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $table = 'properties';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];
}
