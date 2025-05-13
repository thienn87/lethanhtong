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
        // Add composite index on tuition_monthly_fee_listings for the main query
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            $table->index(['mshs', 'year_month'], 'idx_tuition_mshs_yearmonth');
        });

        // Add index on invoices for the count query
        Schema::table('invoices', function (Blueprint $table) {
            $table->index('year_month', 'idx_invoices_yearmonth');
        });

        // Add index on tuition_groups for the whereIn query
        Schema::table('tuition_groups', function (Blueprint $table) {
            $table->index('code', 'idx_tuition_groups_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            $table->dropIndex('idx_tuition_mshs_yearmonth');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_yearmonth');
        });

        Schema::table('tuition_groups', function (Blueprint $table) {
            $table->dropIndex('idx_tuition_groups_code');
        });
    }
};