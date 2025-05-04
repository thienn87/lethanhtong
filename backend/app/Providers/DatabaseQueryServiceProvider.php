<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Events\QueryExecuted;

class DatabaseQueryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Load database optimization configuration
        $config = config('database-optimization');
        
        // Skip if configuration is not available
        if (!$config) {
            return;
        }
        
        // Configure query logging for performance monitoring
        if ($config['monitoring']['query_logging']['enabled']) {
            DB::listen(function (QueryExecuted $query) use ($config) {
                $threshold = $config['postgres']['explain']['slow_query_threshold'];
                
                // Log slow queries
                if ($query->time > $threshold) {
                    $sql = $query->sql;
                    $bindings = $query->bindings;
                    $time = $query->time;
                    
                    // Format the SQL with bindings
                    $sql = str_replace(['%', '?'], ['%%', '%s'], $sql);
                    $sql = vsprintf($sql, array_map(function ($binding) {
                        return is_numeric($binding) ? $binding : "'{$binding}'";
                    }, $bindings));
                    
                    // Log the slow query
                    Log::channel('daily')->warning("Slow query ({$time}ms): {$sql}");
                    
                    // If EXPLAIN logging is enabled, capture the execution plan
                    if ($config['postgres']['explain']['log_slow_queries']) {
                        $this->logQueryExplain($sql);
                    }
                }
            });
        }
        
        // Set default chunk size for when processing large datasets
        $this->app->singleton('db.chunk_size', function () use ($config) {
            return $config['query']['chunk_size'];
        });
    }
    
    /**
     * Log the execution plan for a query
     *
     * @param string $sql
     * @return void
     */
    protected function logQueryExplain($sql)
    {
        try {
            $config = config('database-optimization.postgres.explain');
            $format = $config['format'];
            $analyze = $config['analyze'] ? 'ANALYZE' : '';
            
            // Skip EXPLAIN for non-SELECT queries
            if (!preg_match('/^SELECT/i', trim($sql))) {
                return;
            }
            
            // Get the execution plan
            $explainSql = "EXPLAIN ({$format}, {$analyze}) {$sql}";
            $result = DB::select($explainSql);
            
            // Log the execution plan
            if (!empty($result)) {
                Log::channel('daily')->info("Query execution plan: " . json_encode($result));
            }
        } catch (\Exception $e) {
            Log::error("Failed to get query execution plan: " . $e->getMessage());
        }
    }
}