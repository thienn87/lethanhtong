<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DropStudentBalanceTable extends Migration
{
    /**
     * Run the migration.
     *
     * @return void
     */
    public function up()
    {
        try {
            // Check if the table exists before attempting to drop it
            if (Schema::hasTable('student_balance')) {
                // Drop foreign keys if they exist
                if (Schema::hasColumn('student_balance', 'mshs')) {
                    // Check if there's a foreign key constraint
                    $foreignKeys = DB::select(
                        "SELECT tc.constraint_name
                         FROM information_schema.table_constraints tc
                         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                         WHERE tc.constraint_type = 'FOREIGN KEY'
                         AND tc.table_name = 'student_balance'
                         AND kcu.column_name = 'mshs'"
                    );
                    
                    // Drop each foreign key constraint
                    foreach ($foreignKeys as $foreignKey) {
                        Schema::table('student_balance', function (Blueprint $table) use ($foreignKey) {
                            $table->dropForeign($foreignKey->constraint_name);
                        });
                    }
                }
                
                // Drop the table
                Schema::dropIfExists('student_balance');
                
                Log::info('student_balance table has been dropped successfully.');
            } else {
                Log::info('student_balance table does not exist, no action needed.');
            }
        } catch (\Exception $e) {
            Log::error('Error dropping student_balance table: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Reverse the migration.
     *
     * @return void
     */
    public function down()
    {
        // Recreate the table if needed
        if (!Schema::hasTable('student_balance')) {
            Schema::create('student_balance', function (Blueprint $table) {
                $table->id();
                $table->string('mshs');
                $table->decimal('balance', 15, 2)->default(0);
                $table->json('detail')->nullable();
                $table->timestamps();
                
                // Add foreign key constraint
                $table->foreign('mshs')
                      ->references('mshs')
                      ->on('students')
                      ->onDelete('cascade');
            });
            
            Log::info('student_balance table has been recreated.');
        }
    }
}