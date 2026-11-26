<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MainInventory extends Model
{
    protected $table = 'main_inventory';

    public $timestamps = false;

    protected $fillable = [
        'item_id',
        'previous_rf_num',
        'rf_num',
        'qty',
        'parstock',
        'stockin',
        'stockout',
        'last_updated',
    ];
}