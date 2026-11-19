<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'suppliers';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'contact_person',
        'phone_number',
        'email',
        'address'
    ];
}
