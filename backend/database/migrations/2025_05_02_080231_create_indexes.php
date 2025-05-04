
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreateIndexes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        try {
            // PostgreSQL syntax for creating indexes
            DB::statement('CREATE INDEX IF NOT EXISTS idx_transactions_mshs ON transactions (mshs)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_transactions_mshs_payment_date ON transactions (mshs, payment_date)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_students_mshs ON students (mshs)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_tuition_groups_grade ON tuition_groups (grade)');
            
            Log::info('Successfully created database indexes');
        } catch (\Exception $e) {
            Log::error('Failed to create indexes: ' . $e->getMessage());
            // Don't throw the exception to prevent migration failure
            // This allows the migration to complete even if indexes can't be created
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        try {
            // Drop indexes if needed
            DB::statement('DROP INDEX IF EXISTS idx_transactions_mshs');
            DB::statement('DROP INDEX IF EXISTS idx_transactions_mshs_payment_date');
            DB::statement('DROP INDEX IF EXISTS idx_students_mshs');
            DB::statement('DROP INDEX IF EXISTS idx_tuition_groups_grade');
            
            Log::info('Successfully dropped database indexes');
        } catch (\Exception $e) {
            Log::error('Failed to drop indexes: ' . $e->getMessage());
            // Don't throw the exception to prevent migration failure
        }
    }
}
