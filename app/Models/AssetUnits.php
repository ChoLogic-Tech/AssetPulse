<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetUnits extends Model
{
    protected $table = 'asset_units';

    public $timestamps = false;

    protected $fillable = [
        'item_id',
        'supplier_id',
        'serial_number',
        'status',
        'property_id',
        'location_id',
        'date_received',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(ItemMasterlist::class, 'item_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}