<?php

namespace App\Observers;

use App\Models\AuditLogs;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ItemMasterlist;
use App\Models\Models;
use App\Models\Sku;
use App\Models\UnitOfMeasure;
use Illuminate\Support\Facades\Auth;

class ItemMasterListObserver
{
    /**
     * Handle the ItemMasterlist "created" event.
     */
    public function created(ItemMasterlist $itemMasterlist): void
    {
        $itemMasterlist->loadMissing('sku');
        $skuCode = $itemMasterlist->sku?->sku_code ?? "SKU #{$itemMasterlist->sku_id}";

        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'CREATE',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => "Created Item Masterlist {$itemMasterlist->item_name} ({$skuCode}).",
        ]);
    }

    /**
     * Handle the ItemMasterlist "updated" event.
     */
    public function updated(ItemMasterlist $itemMasterlist): void
    {
        $changes = collect($itemMasterlist->getChanges())
            ->except(['updated_at']);

        if ($changes->isEmpty()) {
            $description = "Updated Item Masterlist {$itemMasterlist->item_name} — no field changes.";
        } elseif ($changes->has('item_name')) {
            $oldName = $itemMasterlist->getOriginal('item_name') ?: 'none';
            $newName = $itemMasterlist->item_name;
            $description = "Updated Item Masterlist {$oldName} → {$newName}.";

            $otherChanges = $this->formatOtherChanges($changes->except(['item_name']), $itemMasterlist);
            if ($otherChanges !== '') {
                $description = rtrim($description, '.') . " ({$otherChanges}).";
            }
        } else {
            $summary = $this->formatOtherChanges($changes, $itemMasterlist);
            $description = "Updated Item Masterlist {$itemMasterlist->item_name} — {$summary}.";
        }

        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'UPDATE',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => $description,
        ]);
    }

    /**
     * Handle the ItemMasterlist "deleted" event.
     */
    public function deleted(ItemMasterlist $itemMasterlist): void
    {
        $itemMasterlist->loadMissing('sku');
        $skuCode = $itemMasterlist->sku?->sku_code ?? "SKU #{$itemMasterlist->sku_id}";

        AuditLogs::create([
            'user_id' => Auth::id(),
            'action_type' => 'DELETE',
            'table_name' => 'item_masterlist',
            'record_id' => $itemMasterlist->id,
            'description' => "Deleted Item Masterlist {$itemMasterlist->item_name} ({$skuCode}).",
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

    /**
     * Format non-name changed fields into a readable summary string.
     */
    private function formatOtherChanges(\Illuminate\Support\Collection $changes, ItemMasterlist $itemMasterlist): string
    {
        if ($changes->isEmpty()) {
            return '';
        }

        return $changes->map(function ($newValue, $field) use ($itemMasterlist) {
            $oldValue = $itemMasterlist->getOriginal($field);

            [$label, $oldDisplay, $newDisplay] = $this->formatFieldChange(
                $field,
                $oldValue,
                $newValue
            );

            return "{$label}: {$oldDisplay} → {$newDisplay}";
        })->implode(', ');
    }

    /**
     * Format a changed field into a readable label and old/new display values.
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private function formatFieldChange(string $field, mixed $oldValue, mixed $newValue): array
    {
        return match ($field) {
            'sku_id' => [
                'SKU',
                $this->resolveLookupValue(Sku::class, $oldValue, 'sku_code', 'none'),
                $this->resolveLookupValue(Sku::class, $newValue, 'sku_code', 'none'),
            ],
            'uom_id' => [
                'Unit of Measure',
                $this->resolveLookupValue(UnitOfMeasure::class, $oldValue, 'name', 'none'),
                $this->resolveLookupValue(UnitOfMeasure::class, $newValue, 'name', 'none'),
            ],
            'brand_id' => [
                'Brand',
                $this->resolveLookupValue(Brand::class, $oldValue, 'name', 'none'),
                $this->resolveLookupValue(Brand::class, $newValue, 'name', 'none'),
            ],
            'model_id' => [
                'Model',
                $this->resolveLookupValue(Models::class, $oldValue, 'name', 'none'),
                $this->resolveLookupValue(Models::class, $newValue, 'name', 'none'),
            ],
            'category_id' => [
                'Category',
                $this->resolveLookupValue(Category::class, $oldValue, 'name', 'none'),
                $this->resolveLookupValue(Category::class, $newValue, 'name', 'none'),
            ],
            default => [
                ucfirst(str_replace('_', ' ', $field)),
                $oldValue === null || $oldValue === '' ? 'none' : (string) $oldValue,
                $newValue === null || $newValue === '' ? 'none' : (string) $newValue,
            ],
        };
    }

    /**
     * Resolve a foreign key ID to a human-readable column value.
     *
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $modelClass
     */
    private function resolveLookupValue(string $modelClass, mixed $id, string $column, string $fallback): string
    {
        if ($id === null || $id === '') {
            return $fallback;
        }

        $record = $modelClass::find($id);

        return $record?->{$column} ?? "#{$id}";
    }
}