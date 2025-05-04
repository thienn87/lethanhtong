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
        Schema::create('tuition_monthly_fee_listings', function (Blueprint $table) {
            $table->id();
            $table->integer('month');
            $table->integer('year');
            $table->string('mshs');
            $table->string('tuitions');
            $table->integer('dudau');
            $table->integer('phaithu');
            $table->integer('dathu');
            $table->integer('duno');
            $table->string('transaction_id');
            $table->timestamps();
        });
    } 
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_monthly_fee_listings');
    }
};
