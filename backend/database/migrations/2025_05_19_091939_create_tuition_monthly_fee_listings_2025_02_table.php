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
        Schema::create('tuition_monthly_fee_listings_2025_02', function (Blueprint $table) {
            $table->increments('id');
            $table->smallInteger('month');
            $table->smallInteger('year');
            $table->string('year_month', 7);
            $table->string('mshs', 32)->index('tuition_monthly_fee_listings_2025_02_mshs_idx');
            $table->string('student_name');
            $table->string('tuitions')->nullable();
            $table->jsonb('dudau')->nullable()->default('[]');
            $table->jsonb('phaithu')->nullable()->default('[]');
            $table->jsonb('dathu')->nullable()->default('[]');
            $table->jsonb('duno')->nullable()->default('[]');
            $table->jsonb('invoice_ids')->nullable()->default('[]');
            $table->timestamps();

            $table->primary(['id', 'year_month']);
            $table->index(['mshs', 'year_month'], 'tuition_monthly_fee_listings_2025_02_mshs_year_month_idx');
            $table->index(['year', 'month'], 'tuition_monthly_fee_listings_2025_02_year_month_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_monthly_fee_listings_2025_02');
    }
};
