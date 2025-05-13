<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SearchService;

class CreateSearchIndexes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'search:create-indexes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create database indexes for search performance optimization';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking and creating search indexes...');
        
        $searchService = app(SearchService::class);
        $result = $searchService->ensureSearchIndexes();
        
        $this->info('Student table indexes: ' . implode(', ', $result['student_indexes']));
        $this->info('Transaction table indexes: ' . implode(', ', $result['transaction_indexes']));
        $this->info('Invoice table indexes: ' . implode(', ', $result['invoice_indexes']));
        
        $this->info('Search indexes have been checked and created if needed.');
        
        return 0;
    }
}