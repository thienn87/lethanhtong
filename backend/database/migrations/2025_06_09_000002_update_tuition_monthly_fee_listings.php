<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateTuitionMonthlyFeeListings extends Migration
{
    public function up()
    {
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            // Add year_month for partitioning
            $table->string('year_month', 7)->after('year')->index();

            // Rename transaction_id to invoice_ids and change to JSON
            $table->json('invoice_ids')->nullable()->after('duno');
            $table->dropColumn('transaction_id');

            // Add indexes
            $table->index(['year', 'month'], 'idx_year_month');
            $table->index('mshs');
        });

        // Fill year_month for existing records
        DB::statement("UPDATE tuition_monthly_fee_listings SET year_month = year || '-' || LPAD(month::text, 2, '0')");

        // MySQL partitioning (optional, requires raw SQL)
        // Note: Partitioning must be set at table creation, so this is for reference.
        //DB::statement('ALTER TABLE tuition_monthly_fee_listings_partitioned PARTITION BY LIST (year_month)');
    }

    public function down()
    {
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            $table->dropIndex('idx_year_month');
            $table->dropIndex(['mshs']);
            $table->dropColumn('year_month');
            $table->dropColumn('invoice_ids');
            $table->unsignedBigInteger('transaction_id')->nullable()->after('duno');
        });
    }
}