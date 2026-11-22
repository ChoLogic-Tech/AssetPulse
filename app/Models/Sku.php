<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sku extends Model
{
    protected $table = 'sku';

    public $timestamps = true;

    protected $fillable = [
        'sku_code',
        'descriptions',
        'created_at',
        'updated_at',
    ];
}
