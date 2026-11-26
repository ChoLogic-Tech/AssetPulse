<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnitOfMeasure extends Model
{
    protected $table = 'uom';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'code',
        'descriptions',
    ];
}
