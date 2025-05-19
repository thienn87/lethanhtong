<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('outstandingdebt', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('year');
            $table->decimal('revenue', 15);
            $table->decimal('outstandingdebt', 15);
            $table->decimal('debt', 15);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outstandingdebt');
    }
};
