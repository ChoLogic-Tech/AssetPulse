<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sku', function (Blueprint $table) {
            $table->increments('id'); // integer primary key + sequence in PostgreSQL
            $table->string('sku_code', 100)->unique();
            $table->string('descriptions', 255)->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sku');
    }
};