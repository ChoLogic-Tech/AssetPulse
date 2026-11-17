<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Inertia\Inertia;

class PropertyController extends Controller {

    public function store () {

    }

    public function index () {

        $property = Property::orderBy('id', 'asc')->get();

        return Inertia::render('Settings/Properties', [
            'properties' => $property
        ]);

    }

    public function update () {

    }

    public function destroy () {

    }


}