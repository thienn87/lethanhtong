<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\Student;
use App\Models\StudentBalance;

class ImportStudentBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:student-balances {file : Path to the CSV file} {--force : Force import without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import student balances from a CSV file';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $filePath = $this->argument('file');
        
        if (!file_exists($filePath)) {
            $this->error('CSV file not found: ' . $filePath);
            return 1;
        }
        
        $this->info('Starting to import balances from CSV file: ' . $filePath);
        
        // Confirm before proceeding
        if (!$this->option('force') && !$this->confirm('This will update student balances. Do you want to continue?')) {
            $this->info('Import cancelled.');
            return 0;
        }
        
        // Open the CSV file
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error('Could not open CSV file');
            return 1;
        }
        
        // Read the header row to determine column positions
        $header = fgetcsv($handle);
        
        // Find the column indexes for MSHS and balance
        $mshsIndex = array_search('mshs', array_map('strtolower', $header));
        $balanceIndex = array_search('balance', array_map('strtolower', $header));
        
        if ($mshsIndex === false || $balanceIndex === false) {
            // Try alternative column names
            $mshsIndex = array_search('ma_hoc_sinh', array_map('strtolower', $header));
            $balanceIndex = array_search('so_du', array_map('strtolower', $header));
            
            if ($mshsIndex === false || $balanceIndex === false) {
                $this->error('Could not find required columns (mshs and balance) in CSV file');
                fclose($handle);
                return 1;
            }
        }
        
        $this->info('Found columns: MSHS at position ' . $mshsIndex . ', Balance at position ' . $balanceIndex);
        
        // Counters for statistics
        $updated = 0;
        $created = 0;
        $errors = 0;
        $notFound = 0;
        
        // Create a progress bar
        $totalLines = $this->countLines($filePath) - 1; // Subtract 1 for the header
        $bar = $this->output->createProgressBar($totalLines);
        $bar->start();
        
        // Process each row
        $lineNumber = 1; // Start from 1 because we already read the header
        while (($row = fgetcsv($handle)) !== false) {
            $lineNumber++;
            
            // Skip empty rows
            if (empty($row[$mshsIndex])) {
                $bar->advance();
                continue;
            }
            
            try {
                $mshs = trim($row[$mshsIndex]);
                $balance = trim($row[$balanceIndex]);
                
                // Convert balance to a number, handling different formats
                $balance = str_replace([',', ' '], '', $balance);
                $balance = (float) $balance;
                
                // Find the student
                $student = Student::where('mshs', $mshs)->first();
                
                if (!$student) {
                    Log::warning("Student with MSHS $mshs not found");
                    $notFound++;
                    $bar->advance();
                    continue;
                }
                
                // Update or create the balance record
                $balanceRecord = StudentBalance::where('mshs', $mshs)->first();
                
                if ($balanceRecord) {
                    $balanceRecord->balance = $balance;
                    $balanceRecord->save();
                    $updated++;
                } else {
                    StudentBalance::create([
                        'mshs' => $mshs,
                        'balance' => $balance
                    ]);
                    $created++;
                }
            } catch (\Exception $e) {
                Log::error("CSV import error on line $lineNumber: " . $e->getMessage());
                $errors++;
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        fclose($handle);
        
        $this->info("Import completed:");
        $this->info("- Updated: $updated records");
        $this->info("- Created: $created records");
        $this->info("- Not found: $notFound students");
        $this->info("- Errors: $errors");
        
        return 0;
    }
    
    /**
     * Count the number of lines in a file
     *
     * @param string $filePath
     * @return int
     */
    private function countLines($filePath)
    {
        $lineCount = 0;
        $handle = fopen($filePath, 'r');
        while (!feof($handle)) {
            $line = fgets($handle);
            $lineCount++;
        }
        fclose($handle);
        return $lineCount;
    }
}