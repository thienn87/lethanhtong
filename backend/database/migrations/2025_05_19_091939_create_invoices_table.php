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
        Schema::create('invoices', function (Blueprint $table) {
            $table->increments('id');
            $table->string('invoice_id')->nullable()->index();
            $table->string('mshs', 32)->nullable()->index();
            $table->string('transaction_id')->nullable()->index();
            $table->text('invoice_details')->nullable();
            $table->timestamps();
            $table->string('year_month', 7)->index('idx_invoices_yearmonth');
            $table->string('status')->default('completed');

            $table->primary(['id', 'year_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
