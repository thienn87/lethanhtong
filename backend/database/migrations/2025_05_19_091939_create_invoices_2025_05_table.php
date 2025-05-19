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
        Schema::create('invoices_2025_05', function (Blueprint $table) {
            $table->increments('id');
            $table->string('invoice_id')->nullable()->index('invoices_2025_05_invoice_id_idx');
            $table->string('mshs', 32)->nullable()->index('invoices_2025_05_mshs_idx');
            $table->string('transaction_id')->nullable()->index('invoices_2025_05_transaction_id_idx');
            $table->text('invoice_details')->nullable();
            $table->timestamps();
            $table->string('year_month', 7)->index('invoices_2025_05_year_month_idx');
            $table->string('status')->default('completed');

            $table->primary(['id', 'year_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices_2025_05');
    }
};
