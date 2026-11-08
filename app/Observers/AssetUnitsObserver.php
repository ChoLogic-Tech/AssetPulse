<?php

namespace App\Observers;

use App\Models\AssetUnits;

class AssetUnitsObserver
{
    /**
     * Handle the AssetUnits "created" event.
     */
    public function created(AssetUnits $assetUnits): void
    {
        //
    }

    /**
     * Handle the AssetUnits "updated" event.
     */
    public function updated(AssetUnits $assetUnits): void
    {
        //
    }

    /**
     * Handle the AssetUnits "deleted" event.
     */
    public function deleted(AssetUnits $assetUnits): void
    {
        //
    }

    /**
     * Handle the AssetUnits "restored" event.
     */
    public function restored(AssetUnits $assetUnits): void
    {
        //
    }

    /**
     * Handle the AssetUnits "force deleted" event.
     */
    public function forceDeleted(AssetUnits $assetUnits): void
    {
        //
    }
}
