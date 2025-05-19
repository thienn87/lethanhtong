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
        Schema::create('transactions_2025_03', function (Blueprint $table) {
            $table->increments('id');
            $table->string('student_name')->nullable()->index('transactions_2025_03_student_name_idx');
            $table->string('mshs', 32)->nullable()->index('transactions_2025_03_mshs_idx');
            $table->string('paid_code', 32)->nullable();
            $table->bigInteger('amount_paid')->nullable();
            $table->string('payment_date', 32)->nullable();
            $table->text('note')->nullable();
            $table->string('invoice_no')->nullable();
            $table->timestamps();
            $table->string('year_month', 7);

            $table->primary(['id', 'year_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions_2025_03');
    }
};
