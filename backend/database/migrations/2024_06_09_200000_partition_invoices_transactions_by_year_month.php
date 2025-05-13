<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PartitionInvoicesTransactionsByYearMonth extends Migration
{
    public function up()
    {
        // 1. Add year_month column if not exists
        foreach (['invoices', 'transactions'] as $table) {
            if (!Schema::hasColumn($table, 'year_month')) {
                Schema::table($table, function ($t) {
                    $t->string('year_month', 7)->nullable()->index();
                });
            }
        }

        // 2. Backfill year_month for existing data
        // Use PostgreSQL string concatenation and LPAD for month
        DB::statement("UPDATE invoices SET year_month = to_char(created_at, 'YYYY-MM')");
        DB::statement("UPDATE transactions SET year_month = to_char(created_at, 'YYYY-MM')");

        // 3. Recreate as partitioned tables
        // a) Rename old tables
        DB::statement("ALTER TABLE invoices RENAME TO invoices_old");
        DB::statement("ALTER TABLE transactions RENAME TO transactions_old");

        // b) Create new partitioned tables
        DB::statement("
            CREATE TABLE invoices (
                id SERIAL,
                invoice_id VARCHAR(255),
                mshs VARCHAR(32),
                transaction_id VARCHAR(255),
                invoice_details TEXT,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE,
                year_month VARCHAR(7) NOT NULL,
                PRIMARY KEY (id, year_month)
            ) PARTITION BY LIST (year_month);
        ");
        DB::statement("
            CREATE TABLE transactions (
                id SERIAL,
                student_name VARCHAR(255),
                mshs VARCHAR(32),
                paid_code VARCHAR(32),
                amount_paid BIGINT,
                payment_date VARCHAR(32),
                note TEXT,
                invoice_no VARCHAR(255),
                created_at TIMESTAMP(0) WITHOUT TIME ZONE,
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE,
                year_month VARCHAR(7) NOT NULL,
                PRIMARY KEY (id, year_month)
            ) PARTITION BY LIST (year_month);
        ");

        // c) Get all year_months from old tables
        $invoiceMonths = DB::table('invoices_old')->select('year_month')->distinct()->pluck('year_month');
        $transactionMonths = DB::table('transactions_old')->select('year_month')->distinct()->pluck('year_month');
        $allMonths = collect($invoiceMonths)->merge($transactionMonths)->unique();

        // d) Create partitions for each year_month
        foreach ($allMonths as $ym) {
            if ($ym) {
                $partitionName1 = 'invoices_' . str_replace('-', '_', $ym);
                $partitionName2 = 'transactions_' . str_replace('-', '_', $ym);
                DB::statement("CREATE TABLE IF NOT EXISTS $partitionName1 PARTITION OF invoices FOR VALUES IN ('$ym');");
                DB::statement("CREATE TABLE IF NOT EXISTS $partitionName2 PARTITION OF transactions FOR VALUES IN ('$ym');");
            }
        }

        // e) Copy data from old tables to new partitioned tables
        DB::statement("INSERT INTO invoices (id, invoice_id, mshs, transaction_id, invoice_details, created_at, updated_at, year_month)
            SELECT id, invoice_id, mshs, transaction_id, invoice_details, created_at, updated_at, year_month FROM invoices_old");
        DB::statement("INSERT INTO transactions (id, student_name, mshs, paid_code, amount_paid, payment_date, note, invoice_no, created_at, updated_at, year_month)
            SELECT id, student_name, mshs, paid_code, amount_paid, payment_date, note, invoice_no, created_at, updated_at, year_month FROM transactions_old");

        // f) Drop old tables
        Schema::drop('invoices_old');
        Schema::drop('transactions_old');
        // 2. Backfill year_month for existing data using UTC+7
        DB::statement("UPDATE invoices SET year_month = to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')");
        DB::statement("UPDATE transactions SET year_month = to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')");
    }

    public function down()
    {
        // Drop partitioned tables and recreate as normal tables (no partitioning)
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('transactions');

        // Optionally, you could restore from backup or recreate the original schema here
    }
}