<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_masterlist', function (Blueprint $table) {
            $table->integer('uom_id')->nullable();

            $table->foreign('uom_id', 'item_masterlist_uom_id_fkey')
                ->references('id')
                ->on('uom')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('item_masterlist', function (Blueprint $table) {
            $table->dropForeign('item_masterlist_uom_id_fkey');
            $table->dropColumn('uom_id');
        });
    }
};