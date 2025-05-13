<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\TuitionMonthlyFeeListingController;

class CreateMonthlyTuitionRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tuition:create-monthly-records';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create monthly tuition fee records on the 1st day of the month';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Check if today is the 1st day of the month
        $now = now('Asia/Bangkok');
        $day = (int)$now->format('d');
        
        if ($day !== 1) {
            $this->info('Today is not the 1st day of the month. Command will not run.');
            return 0;
        }
        
        $this->info('Creating monthly tuition fee records...');
        
        try {
            $controller = new TuitionMonthlyFeeListingController();
            $response = $controller->create();
            
            // Parse the response
            $responseData = json_decode($response->getContent(), true);
            
            if ($responseData['status'] === 'success') {
                $this->info('Success: ' . $responseData['message']);
                $this->info('Records created: ' . $responseData['count']);
                return 0;
            } else {
                $this->error('Error: ' . $responseData['message']);
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('Exception: ' . $e->getMessage());
            return 1;
        }
    }
}