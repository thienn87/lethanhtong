<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class AddComprehensiveIndexes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Try to detect if we're running in Docker or on the host machine
        $isDocker = file_exists('/.dockerenv');
        
        // Configure the database connection based on environment
        if ($isDocker) {
            Log::info('Detected Docker environment, using postgres service name');
            Config::set('database.connections.pgsql.host', 'postgres');
        } else {
            Log::info('Detected host machine environment, using localhost');
            Config::set('database.connections.pgsql.host', 'localhost');
        }
        
        // Clear the database connection cache
        DB::purge('pgsql');
        DB::reconnect('pgsql');
        
        try {
            // Students table indexes
            $this->createIndexIfNotExists('students', 'idx_students_mshs', ['mshs']);
            $this->createIndexIfNotExists('students', 'idx_students_grade', ['grade']);
            $this->createIndexIfNotExists('students', 'idx_students_class', ['class']);
            $this->createIndexIfNotExists('students', 'idx_students_name', ['name']);
            $this->createIndexIfNotExists('students', 'idx_students_status', ['status']);
            $this->createIndexIfNotExists('students', 'idx_students_created_at', ['created_at']);
            
            // Transactions table indexes
            $this->createIndexIfNotExists('transactions', 'idx_transactions_mshs', ['mshs']);
            $this->createIndexIfNotExists('transactions', 'idx_transactions_paid_code', ['paid_code']);
            $this->createIndexIfNotExists('transactions', 'idx_transactions_payment_date', ['payment_date']);
            $this->createIndexIfNotExists('transactions', 'idx_transactions_mshs_payment_date', ['mshs', 'payment_date']);
            $this->createIndexIfNotExists('transactions', 'idx_transactions_created_at', ['created_at']);
            
            // Invoice table indexes (if exists)
            if (Schema::hasTable('invoices')) {
                $this->createIndexIfNotExists('invoices', 'idx_invoices_mshs', ['mshs']);
                $this->createIndexIfNotExists('invoices', 'idx_invoices_invoice_number', ['invoice_number']);
                $this->createIndexIfNotExists('invoices', 'idx_invoices_invoice_date', ['invoice_date']);
                $this->createIndexIfNotExists('invoices', 'idx_invoices_status', ['status']);
                $this->createIndexIfNotExists('invoices', 'idx_invoices_created_at', ['created_at']);
            }
            
            // Classes table indexes
            $this->createIndexIfNotExists('classes', 'idx_classes_grade', ['grade']);
            $this->createIndexIfNotExists('classes', 'idx_classes_name', ['name']);
            
            // Tuition groups table indexes
            $this->createIndexIfNotExists('tuition_groups', 'idx_tuition_groups_grade', ['grade']);
            $this->createIndexIfNotExists('tuition_groups', 'idx_tuition_groups_code', ['code']);
            $this->createIndexIfNotExists('tuition_groups', 'idx_tuition_groups_month_apply', ['month_apply']);
            
            // Outstanding debt table indexes
            $this->createIndexIfNotExists('outstanding_debts', 'idx_outstanding_debts_year', ['year']);
            
            // Users table indexes (if exists)
            if (Schema::hasTable('users')) {
                $this->createIndexIfNotExists('users', 'idx_users_email', ['email']);
                $this->createIndexIfNotExists('users', 'idx_users_created_at', ['created_at']);
            }
            
            Log::info('Successfully created all database indexes');
        } catch (\Exception $e) {
            Log::error('Failed to create indexes: ' . $e->getMessage());
            // Don't throw the exception to prevent migration failure
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Try to detect if we're running in Docker or on the host machine
        $isDocker = file_exists('/.dockerenv');
        
        // Configure the database connection based on environment
        if ($isDocker) {
            Log::info('Detected Docker environment, using postgres service name');
            Config::set('database.connections.pgsql.host', 'postgres');
        } else {
            Log::info('Detected host machine environment, using localhost');
            Config::set('database.connections.pgsql.host', 'localhost');
        }
        
        // Clear the database connection cache
        DB::purge('pgsql');
        DB::reconnect('pgsql');
        
        try {
            // Students table indexes
            $this->dropIndexIfExists('students', 'idx_students_mshs');
            $this->dropIndexIfExists('students', 'idx_students_grade');
            $this->dropIndexIfExists('students', 'idx_students_class');
            $this->dropIndexIfExists('students', 'idx_students_name');
            $this->dropIndexIfExists('students', 'idx_students_status');
            $this->dropIndexIfExists('students', 'idx_students_created_at');
            
            // Transactions table indexes
            $this->dropIndexIfExists('transactions', 'idx_transactions_mshs');
            $this->dropIndexIfExists('transactions', 'idx_transactions_paid_code');
            $this->dropIndexIfExists('transactions', 'idx_transactions_payment_date');
            $this->dropIndexIfExists('transactions', 'idx_transactions_mshs_payment_date');
            $this->dropIndexIfExists('transactions', 'idx_transactions_created_at');
            
            // Invoice table indexes
            if (Schema::hasTable('invoices')) {
                $this->dropIndexIfExists('invoices', 'idx_invoices_mshs');
                $this->dropIndexIfExists('invoices', 'idx_invoices_invoice_number');
                $this->dropIndexIfExists('invoices', 'idx_invoices_invoice_date');
                $this->dropIndexIfExists('invoices', 'idx_invoices_status');
                $this->dropIndexIfExists('invoices', 'idx_invoices_created_at');
            }
            
            // Classes table indexes
            $this->dropIndexIfExists('classes', 'idx_classes_grade');
            $this->dropIndexIfExists('classes', 'idx_classes_name');
            
            // Tuition groups table indexes
            $this->dropIndexIfExists('tuition_groups', 'idx_tuition_groups_grade');
            $this->dropIndexIfExists('tuition_groups', 'idx_tuition_groups_code');
            $this->dropIndexIfExists('tuition_groups', 'idx_tuition_groups_month_apply');
            
            // Outstanding debt table indexes
            $this->dropIndexIfExists('outstanding_debts', 'idx_outstanding_debts_year');
            
            // Users table indexes
            if (Schema::hasTable('users')) {
                $this->dropIndexIfExists('users', 'idx_users_email');
                $this->dropIndexIfExists('users', 'idx_users_created_at');
            }
            
            Log::info('Successfully dropped all database indexes');
        } catch (\Exception $e) {
            Log::error('Failed to drop indexes: ' . $e->getMessage());
            // Don't throw the exception to prevent migration failure
        }
    }

    /**
     * Helper method to create an index if it doesn't exist
     *
     * @param string $table
     * @param string $indexName
     * @param array $columns
     * @return void
     */
    private function createIndexIfNotExists($table, $indexName, $columns)
    {
        try {
            // Check if the table exists
            if (!Schema::hasTable($table)) {
                Log::warning("Table {$table} does not exist, skipping index creation");
                return;
            }
            
            // Check if the index already exists
            $indexExists = DB::select("SELECT to_regclass('public.{$indexName}') as index_exists")[0]->index_exists;
            
            if (!$indexExists) {
                $columnList = implode(', ', $columns);
                DB::statement("CREATE INDEX {$indexName} ON {$table} ({$columnList})");
                Log::info("Created index {$indexName} on {$table}");
            } else {
                Log::info("Index {$indexName} already exists on {$table}");
            }
        } catch (\Exception $e) {
            Log::error("Error creating index {$indexName} on {$table}: " . $e->getMessage());
        }
    }

    /**
     * Helper method to drop an index if it exists
     *
     * @param string $table
     * @param string $indexName
     * @return void
     */
    private function dropIndexIfExists($table, $indexName)
    {
        try {
            // Check if the index exists
            $indexExists = DB::select("SELECT to_regclass('public.{$indexName}') as index_exists")[0]->index_exists;
            
            if ($indexExists) {
                DB::statement("DROP INDEX {$indexName}");
                Log::info("Dropped index {$indexName}");
            } else {
                Log::info("Index {$indexName} does not exist, skipping");
            }
        } catch (\Exception $e) {
            Log::error("Error dropping index {$indexName}: " . $e->getMessage());
        }
    }
}
