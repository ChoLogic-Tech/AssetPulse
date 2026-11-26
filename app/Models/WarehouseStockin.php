<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WarehouseStockin extends Model
{
    protected $table = 'stock_in_logs';

    public $timestamps = false;

    protected $fillable = [
        'item_id',
        'supplier_id',
        'property_id',
        'received_by',
        'quantity',
        'rf_number',
        'invoice_number',
        'received_date',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'item_id' => 'integer',
            'supplier_id' => 'integer',
            'property_id' => 'integer',
            'received_by' => 'integer',
            'quantity' => 'integer',
            'received_date' => 'datetime',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(\stdClass::class, 'item_id');
    }

    public function assetUnits(): HasMany
    {
        return $this->hasMany(AssetUnits::class, 'stock_in_log_id');
    }
}