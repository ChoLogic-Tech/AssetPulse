<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemMasterlist extends Model
{
    protected $table = 'item_masterlist';

    protected $fillable = [
        'sku_id',
        'item_name',
        'brand_id',
        'model_id',
        'uom_id',
        'category_id',
        'description',
    ];

    public function sku ()
    {
        return $this->belongsTo(Sku::class, 'sku_id');
    }

    public function brand() 
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function model() 
    {
        return $this->belongsTo(Models::class, 'model_id');
    }

    public function category() 
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}