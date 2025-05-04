<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;

class MigrateWithHostDetection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:auto {--force} {--seed} {--path=*}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the database migrations with automatic host detection';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Try to detect if we're running in Docker or on the host machine
        $isDocker = file_exists('/.dockerenv');
        
        // If we're in Docker, use the postgres service name
        if ($isDocker) {
            $this->info('Detected Docker environment, using postgres service name');
            Config::set('database.connections.pgsql.host', 'postgres');
        } else {
            // If we're on the host machine, use localhost
            $this->info('Detected host machine environment, using localhost');
            Config::set('database.connections.pgsql.host', 'localhost');
        }
        
        // Clear the database connection cache
        DB::purge('pgsql');
        
        // Build the command arguments
        $command = 'migrate';
        $arguments = [];
        
        if ($this->option('force')) {
            $arguments['--force'] = true;
        }
        
        if ($this->option('seed')) {
            $arguments['--seed'] = true;
        }
        
        if ($this->option('path')) {
            $arguments['--path'] = $this->option('path');
        }
        
        // Run the migration with the updated configuration
        $this->info('Running migrations with correct database host...');
        $exitCode = Artisan::call($command, $arguments);
        
        // Output the migration command results
        $this->info(Artisan::output());
        
        return $exitCode;
    }
}
