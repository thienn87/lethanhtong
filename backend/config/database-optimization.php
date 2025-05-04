<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Database Query Optimization Settings
    |--------------------------------------------------------------------------
    |
    | This file contains configuration settings for optimizing database queries
    | in your Laravel application with PostgreSQL.
    |
    */

    // Cache settings for database queries
    'cache' => [
        // Default cache duration in minutes
        'default_duration' => 60,
        
        // Short-lived cache duration for frequently changing data
        'short_duration' => 5,
        
        // Long-lived cache duration for rarely changing data
        'long_duration' => 1440, // 24 hours
        
        // Cache tags for easier cache management
        'tags' => [
            'students' => 'students_data',
            'transactions' => 'transactions_data',
            'tuition_groups' => 'tuition_groups_data',
        ],
    ],
    
    // Query optimization settings
    'query' => [
        // Maximum number of records to retrieve in a single query
        'chunk_size' => 1000,
        
        // Default select columns to reduce data transfer
        'default_selects' => [
            'students' => ['id', 'mshs', 'name', 'sur_name', 'grade', 'class', 'discount'],
            'transactions' => ['id', 'mshs', 'paid_code', 'amount_paid', 'payment_date'],
            'tuition_groups' => ['id', 'code', 'name', 'grade', 'default_amount', 'month_apply'],
        ],
        
        // Eager loading relationships to reduce N+1 query problems
        'eager_load' => [
            'students' => ['transactions'],
            'transactions' => ['student'],
        ],
    ],
    
    // PostgreSQL specific optimizations
    'postgres' => [
        // Connection pooling settings
        'pool' => [
            'min_size' => 5,
            'max_size' => 20,
            'idle_timeout' => 300, // seconds
        ],
        
        // Query execution plan settings
        'explain' => [
            // Enable logging of slow queries with EXPLAIN
            'log_slow_queries' => true,
            
            // Threshold in milliseconds to consider a query as slow
            'slow_query_threshold' => 1000,
            
            // Format for EXPLAIN output (text, json, xml, yaml)
            'format' => 'json',
            
            // Whether to include analyze information
            'analyze' => true,
        ],
        
        // Index usage monitoring
        'index_monitoring' => [
            // Enable monitoring of index usage
            'enabled' => true,
            
            // Interval in days to check for unused indexes
            'check_interval' => 30,
        ],
    ],
    
    // Performance monitoring settings
    'monitoring' => [
        // Enable query logging for debugging
        'query_logging' => [
            'enabled' => env('DB_QUERY_LOGGING', false),
            'log_path' => storage_path('logs/queries.log'),
        ],
        
        // Enable performance metrics collection
        'metrics' => [
            'enabled' => true,
            'collect_query_time' => true,
            'collect_memory_usage' => true,
        ],
    ],
    
    // Optimization strategies for specific query patterns
    'strategies' => [
        // Strategies for handling large result sets
        'large_results' => [
            // Use cursor for streaming large result sets
            'use_cursor' => true,
            
            // Threshold for using cursor instead of get()
            'cursor_threshold' => 10000,
        ],
        
        // Strategies for handling complex aggregations
        'aggregations' => [
            // Use database views for complex aggregations
            'use_views' => true,
            
            // Cache aggregation results
            'cache_results' => true,
        ],
    ],
];