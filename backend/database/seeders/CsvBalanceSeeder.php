<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Student;
use App\Models\StudentBalance;

class CsvBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $csvFile = base_path('database/KT1_TONG_NEW.csv');
        if (!file_exists($csvFile)) {
            $this->command->error('CSV file not found: ' . $csvFile);
            return;
        }
        
        $this->command->info('Starting to import balances from CSV file...');
        
        // Open the CSV file
        $handle = fopen($csvFile, 'r');
        if (!$handle) {
            $this->command->error('Could not open CSV file');
            return;
        }
        
        // Counters for statistics
        $updated = 0;
        $created = 0;
        $errors = 0;
        $notFound = 0;
        
        // Process each row
        $lineNumber = 0;
        while (($row = fgetcsv($handle, 0, ';')) !== false) { // Use semicolon as the delimiter
            $lineNumber++;
            
            // Skip empty rows
            if (count($row) < 2 || empty($row[0])) {
                continue;
            }
            
            try {
                // In this format, the first column is mshs and the second is balance
                $mshs = trim($row[0]);
                $balance = trim($row[1]);
                
                // Convert balance to a number, handling different formats
                $balance = str_replace([',', ' '], '', $balance);
                $balance = (float) $balance;
                
                // Find the student
                $student = Student::where('mshs', $mshs)->first();
                
                if (!$student) {
                    $this->command->warn("Line $lineNumber: Student with MSHS $mshs not found");
                    $notFound++;
                    continue;
                }
                
                // Update or create the balance record
                $balanceRecord = StudentBalance::where('mshs', $mshs)->first();
                
                if ($balanceRecord) {
                    $balanceRecord->balance = $balance;
                    $balanceRecord->save();
                    $updated++;
                    
                    if ($updated % 100 === 0) {
                        $this->command->info("Updated $updated records so far...");
                    }
                } else {
                    StudentBalance::create([
                        'mshs' => $mshs,
                        'balance' => $balance
                    ]);
                    $created++;
                    
                    if ($created % 100 === 0) {
                        $this->command->info("Created $created records so far...");
                    }
                }
            } catch (\Exception $e) {
                $this->command->error("Error on line $lineNumber: " . $e->getMessage());
                Log::error("CSV import error on line $lineNumber: " . $e->getMessage());
                $errors++;
            }
        }
        
        fclose($handle);
        
        $this->command->info("Import completed:");
        $this->command->info("- Updated: $updated records");
        $this->command->info("- Created: $created records");
        $this->command->info("- Not found: $notFound students");
        $this->command->info("- Errors: $errors");
    }
}