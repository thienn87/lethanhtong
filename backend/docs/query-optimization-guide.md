# Database Query Optimization Guide

This guide provides best practices and techniques for optimizing database queries in our Laravel application with PostgreSQL, with a focus on improving the performance of the OutstandingDebtService.

## Table of Contents

1. [General Optimization Principles](#general-optimization-principles)
2. [Laravel-Specific Optimizations](#laravel-specific-optimizations)
3. [PostgreSQL-Specific Optimizations](#postgresql-specific-optimizations)
4. [Caching Strategies](#caching-strategies)
5. [Monitoring and Profiling](#monitoring-and-profiling)
6. [Specific Optimizations for OutstandingDebtService](#specific-optimizations-for-outstandingdebtservice)

## General Optimization Principles

### Select Only Required Columns

Always specify the columns you need instead of using `SELECT *`:

```php
// Bad
$students = Student::all();

// Good
$students = Student::select('id', 'mshs', 'name', 'grade', 'class')->get();
```

### Use Proper Indexing

Ensure that columns used in WHERE, JOIN, ORDER BY, and GROUP BY clauses are properly indexed:

```php
// This query will be slow without an index on 'mshs'
$student = Student::where('mshs', $mshs)->first();
```

### Batch Processing for Large Datasets

Use chunking for processing large datasets:

```php
Student::chunk(1000, function ($students) {
    foreach ($students as $student) {
        // Process each student
    }
});
```

### Avoid N+1 Query Problems

Use eager loading to avoid N+1 query problems:

```php
// Bad - Will execute N+1 queries
$students = Student::all();
foreach ($students as $student) {
    $transactions = $student->transactions;
}

// Good - Will execute only 2 queries
$students = Student::with('transactions')->get();
foreach ($students as $student) {
    $transactions = $student->transactions;
}
```

## Laravel-Specific Optimizations

### Use Query Builders Effectively

Leverage Laravel's query builder for complex queries:

```php
$results = DB::table('students')
    ->join('transactions', 'students.mshs', '=', 'transactions.mshs')
    ->select('students.mshs', 'students.name', DB::raw('SUM(transactions.amount_paid) as total_paid'))
    ->where('students.grade', '=', 'Grade 10')
    ->groupBy('students.mshs', 'students.name')
    ->having('total_paid', '>', 1000)
    ->get();
```

### Use Database Transactions

Wrap related operations in transactions:

```php
DB::transaction(function () {
    // Multiple database operations
});
```

### Optimize Eloquent Relationships

Define and use relationships properly:

```php
// In Student model
public function transactions()
{
    return $this->hasMany(Transaction::class, 'mshs', 'mshs');
}

// In Transaction model
public function student()
{
    return $this->belongsTo(Student::class, 'mshs', 'mshs');
}
```

## PostgreSQL-Specific Optimizations

### Use PostgreSQL-Specific Features

Take advantage of PostgreSQL-specific features:

```php
// Using JSON operations
$results = DB::table('tuition_groups')
    ->whereJsonContains('properties->applicable_grades', 'Grade 10')
    ->get();

// Using array operations
$results = DB::table('students')
    ->whereRaw("'{$grade}' = ANY(grades)")
    ->get();
```

### Optimize for SSD Storage

If using SSD storage, adjust PostgreSQL settings:

```
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Use Proper Data Types

Use appropriate data types for columns:

- Use `integer` instead of `varchar` for numeric IDs
- Use `timestamp` instead of `varchar` for dates
- Use `enum` types for columns with a fixed set of values

## Caching Strategies

### Cache Expensive Queries

Cache results of expensive queries:

```php
$results = Cache::remember('expensive_query', 60, function () {
    return DB::table('students')
        ->join('transactions', 'students.mshs', '=', 'transactions.mshs')
        ->select(/* ... */)
        ->where(/* ... */)
        ->get();
});
```

### Use Cache Tags for Better Management

Organize cache with tags:

```php
$students = Cache::tags(['students', 'active'])->remember('active_students', 60, function () {
    return Student::where('status', 'active')->get();
});

// Later, you can clear all student-related cache
Cache::tags(['students'])->flush();
```

### Implement Cache Invalidation

Invalidate cache when data changes:

```php
// In your model observer or event listener
public function updated(Student $student)
{
    Cache::forget('student_' . $student->mshs);
    Cache::tags(['students'])->flush();
}
```

## Monitoring and Profiling

### Log Slow Queries

Configure Laravel to log slow queries:

```php
DB::listen(function ($query) {
    if ($query->time > 1000) {
        Log::warning('Slow query: ' . $query->sql);
    }
});
```

### Use EXPLAIN for Query Analysis

Analyze query execution plans:

```php
$explainResults = DB::select('EXPLAIN (FORMAT JSON) SELECT * FROM students WHERE mshs = ?', [$mshs]);
```

### Monitor Index Usage

Check which indexes are being used:

```sql
SELECT
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans
FROM
    pg_stat_user_indexes
JOIN
    pg_stat_user_tables ON pg_stat_user_indexes.relid = pg_stat_user_tables.relid
ORDER BY
    idx_scan DESC;
```

## Specific Optimizations for OutstandingDebtService

### Optimize the `single` Method

The `single` method in OutstandingDebtService is a critical path that needs optimization:

1. **Preload and Cache Common Data**:
   - Cache tuition groups as they rarely change
   - Use in-memory caching for frequently accessed data

2. **Optimize Transaction Filtering**:
   - Use database filtering instead of PHP filtering when possible
   - Index the `payment_date` column for faster filtering

3. **Reduce Data Transfer**:
   - Select only necessary columns
   - Use JSON aggregation for related data when appropriate

4. **Optimize Calculation Logic**:
   - Move complex calculations to the database when possible
   - Use lookup maps for faster access to related data

5. **Implement Progressive Loading**:
   - Load essential data first
   - Load additional details only when needed

### Example Implementation

```php
public function single($mshs)
{
    // Cache the result for this specific student
    return Cache::remember('outstanding_debt_single_' . $mshs, 5, function () use ($mshs) {
        // Get student with only necessary fields
        $student = Student::select('id', 'mshs', 'name', 'grade', 'class', 'discount')
            ->where('mshs', $mshs)
            ->first();
        
        if (!$student) {
            return false;
        }
        
        // Get current and previous month
        $currentMonth = intval(date('n'));
        $previousMonth = $currentMonth - 1 > 0 ? $currentMonth - 1 : 12;
        
        // Get all tuition groups from cache
        $allTuitionGroups = $this->getAllTuitionGroups();
        
        // Get transactions with database filtering
        $allTransactions = Transaction::select('id', 'mshs', 'paid_code', 'amount_paid', 'payment_date')
            ->where('mshs', $mshs)
            ->whereIn('payment_date', [$currentMonth, $previousMonth])
            ->get();
        
        // Group transactions by month for faster access
        $transactionsByMonth = $allTransactions->groupBy('payment_date');
        
        // Get transactions for current and previous month
        $paid_current_month = $transactionsByMonth[$currentMonth] ?? collect([]);
        $paid_previous_month = $transactionsByMonth[$previousMonth] ?? collect([]);
        
        // Calculate debt information
        $debt = $this->getDebtByMonth($currentMonth, $student->grade, $student->discount, $allTuitionGroups);
        $debt_previous = $this->getDebtByMonth($previousMonth, $student->grade, $student->discount, $allTuitionGroups);
        
        // Calculate balances and other details
        // ...
        
        return [
            'student' => $student,
            'discount_rate' => $student->discount,
            // Other calculated data
        ];
    });
}
```

By implementing these optimizations, we can significantly improve the performance of the OutstandingDebtService and reduce the loading time of the `/transaction/outstanding-debt/single` endpoint.