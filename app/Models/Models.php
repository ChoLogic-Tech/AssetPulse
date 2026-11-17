<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Models extends Model
{
    protected $table = 'models';

    // Disable created_at by setting it to null
    const CREATED_AT = null; 

    // Keep updated_at active
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'name',
        'brand_id',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }
}