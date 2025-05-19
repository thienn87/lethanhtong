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
            $table->increments('id');
            $table->smallInteger('month');
            $table->smallInteger('year');
            $table->string('year_month', 7);
            $table->string('mshs', 32)->index('idx_mshs');
            $table->string('student_name');
            $table->string('tuitions')->nullable();
            $table->jsonb('dudau')->nullable()->default('[]');
            $table->jsonb('phaithu')->nullable()->default('[]');
            $table->jsonb('dathu')->nullable()->default('[]');
            $table->jsonb('duno')->nullable()->default('[]');
            $table->jsonb('invoice_ids')->nullable()->default('[]');
            $table->timestamps();

            $table->primary(['id', 'year_month']);
            $table->index(['mshs', 'year_month'], 'idx_tuition_mshs_yearmonth');
            $table->index(['year', 'month'], 'idx_year_month');
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
