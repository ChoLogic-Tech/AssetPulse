<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $table = 'properties';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class, 'property_id');
    }
}