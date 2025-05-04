<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FixInvoiceSequence extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:invoice-sequence';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix the invoice sequence in PostgreSQL';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Fixing invoice sequence...');
        
        try {
            // Get the maximum ID from the invoices table
            $maxId = DB::table('invoices')->max('id');
            
            if ($maxId) {
                // Reset the sequence to start from the max ID + 1
                DB::statement("SELECT setval('invoices_id_seq', $maxId, true)");
                $this->info("Invoice sequence reset to " . ($maxId + 1));
                
                // Verify the current sequence value
                $result = DB::select("SELECT currval('invoices_id_seq') AS current_value")[0];
                $this->info("Current sequence value: " . $result->current_value);
            } else {
                $this->info("No invoices found. Sequence set to 1.");
                DB::statement("SELECT setval('invoices_id_seq', 1, false)");
            }
            
            $this->info('Invoice sequence fixed successfully.');
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to fix invoice sequence: " . $e->getMessage());
            Log::error("Failed to fix invoice sequence: " . $e->getMessage());
            return 1;
        }
    }
}