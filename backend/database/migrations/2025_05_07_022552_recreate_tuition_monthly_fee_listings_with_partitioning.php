<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RecreateTuitionMonthlyFeeListingsWithPartitioning extends Migration
{
    public function up()
    {
        // Drop the old table if it exists
        Schema::dropIfExists('tuition_monthly_fee_listings');

        // Create the new partitioned table (PostgreSQL syntax)
        DB::statement("
            CREATE TABLE tuition_monthly_fee_listings (
                id SERIAL,
                month SMALLINT NOT NULL,
                year SMALLINT NOT NULL,
                year_month VARCHAR(7) NOT NULL,
                PRIMARY KEY (id, year_month),
                mshs VARCHAR(32) NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                tuitions VARCHAR(255),
                dudau BIGINT DEFAULT 0,
                phaithu BIGINT DEFAULT 0,
                dathu BIGINT DEFAULT 0,
                duno BIGINT DEFAULT 0,
                invoice_ids JSONB,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE
            ) PARTITION BY LIST (year_month);
        ");

        // Optionally, create partitions for existing or expected months
        // Example: create partitions for 2024-06 and 2024-07
        // DB::statement("
        //     CREATE TABLE tuition_monthly_fee_listings_2024_06 PARTITION OF tuition_monthly_fee_listings
        //     FOR VALUES IN ('2024-06');
        // ");
        // DB::statement("
        //     CREATE TABLE tuition_monthly_fee_listings_2024_07 PARTITION OF tuition_monthly_fee_listings
        //     FOR VALUES IN ('2024-07');
        // ");

        // Add indexes
        DB::statement("CREATE INDEX idx_year_month ON tuition_monthly_fee_listings (year, month);");
        DB::statement("CREATE INDEX idx_mshs ON tuition_monthly_fee_listings (mshs);");
    }

    public function down()
    {
        // Drop the partitioned table and all its partitions
        Schema::dropIfExists('tuition_monthly_fee_listings');
    }
}