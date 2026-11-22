<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_masterlist', function (Blueprint $table) {
            $table->integer('sku_id')->nullable();

            $table->foreign('sku_id', 'item_masterlist_sku_id_fkey')
                ->references('id')
                ->on('sku')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('item_masterlist', function (Blueprint $table) {
            $table->dropForeign('item_masterlist_sku_id_fkey');
            $table->dropColumn('sku_id');
        });
    }
};