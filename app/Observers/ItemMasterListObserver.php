<?php

namespace App\Observers;

use App\Models\ItemMasterlist;
use App\Models\AuditLogs;
use Illuminate\Support\Facades\Auth;

class ItemMasterListObserver
{
    /**
     * Handle the ItemMasterlist "created" event.
     */
    public function created(ItemMasterlist $itemMasterlist): void
    {
        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'INSERT',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => "Created catalog item: SKU [{$itemMasterlist->sku}] - {$itemMasterlist->item_name}",
        ]);
    }

    /**
     * Handle the ItemMasterlist "updated" event.
     */
    public function updated(ItemMasterlist $itemMasterlist): void
    {
        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'UPDATE',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => "Updated item ID {$itemMasterlist->id} ({$itemMasterlist->sku}). Changes: " . json_encode($itemMasterlist->getChanges()),
        ]);
    }

    /**
     * Handle the ItemMasterlist "deleted" event.
     */
    public function deleted(ItemMasterlist $itemMasterlist): void
    {
        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'DELETE',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => "Deleted catalog item SKU: [{$itemMasterlist->sku}] - {$itemMasterlist->item_name}",
        ]);
    }

    /**
     * Handle the ItemMasterlist "restored" event.
     */
    public function restored(ItemMasterlist $itemMasterlist): void
    {
        // Optional: leave empty if you don't use soft deletes
    }

    /**
     * Handle the ItemMasterlist "force deleted" event.
     */
    public function forceDeleted(ItemMasterlist $itemMasterlist): void
    {
        // Optional: leave empty if you don't use soft deletes
    }
}