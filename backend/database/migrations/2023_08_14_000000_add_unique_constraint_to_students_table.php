<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddUniqueConstraintToStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Check if the column already has a unique constraint using a safer method
        $hasUniqueConstraint = false;
        
        try {
            // Check for unique indexes on the mshs column
            $schema = DB::connection()->getDoctrineSchemaManager();
            $indexes = $schema->listTableIndexes('students');
            
            foreach ($indexes as $index) {
                if ($index->isUnique() && in_array('mshs', $index->getColumns())) {
                    $hasUniqueConstraint = true;
                    break;
                }
            }
        } catch (\Exception $e) {
            // If there's an error checking indexes, we'll assume there's no unique constraint
        }
        
        if (!$hasUniqueConstraint) {
            // Check if there are any duplicate mshs values
            $duplicates = DB::select("
                SELECT mshs, COUNT(*) as count
                FROM students
                GROUP BY mshs
                HAVING COUNT(*) > 1
            ");
                
            if (count($duplicates) > 0) {
                // Handle duplicates by keeping the first occurrence and updating others
                foreach ($duplicates as $duplicate) {
                    $mshs = $duplicate->mshs;
                    
                    // Get all records with this mshs, ordered by id
                    $records = DB::select("
                        SELECT id, mshs
                        FROM students
                        WHERE mshs = ?
                        ORDER BY id
                    ", [$mshs]);
                    
                    // Skip the first record (keep it as is)
                    $firstRecord = true;
                    foreach ($records as $record) {
                        if ($firstRecord) {
                            $firstRecord = false;
                            continue;
                        }
                        
                        // Update other records with a unique mshs
                        $newMshs = $mshs . '_' . $record->id;
                        DB::table('students')
                            ->where('id', $record->id)
                            ->update(['mshs' => $newMshs]);
                    }
                }
            }
            
            // Now add the unique constraint
            Schema::table('students', function (Blueprint $table) {
                $table->unique('mshs');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['mshs']);
        });
    }
}