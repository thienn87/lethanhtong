# Database Optimization Guide

This document provides guidance on database optimization techniques implemented in this project, with a focus on indexes for improving query performance.

## Implemented Indexes

We've added the following indexes to improve query performance:

### Students Table
- `idx_students_mshs`: Primary lookup index for student ID
- `idx_students_grade`: For filtering students by grade
- `idx_students_class`: For filtering students by class
- `idx_students_name`: For name-based searches
- `idx_students_status`: For filtering by student status
- `idx_students_created_at`: For sorting by creation date

### Transactions Table
- `idx_transactions_mshs`: For looking up transactions by student ID
- `idx_transactions_paid_code`: For filtering by payment code
- `idx_transactions_payment_date`: For filtering by payment date
- `idx_transactions_mshs_payment_date`: Composite index for filtering by both student and date
- `idx_transactions_created_at`: For sorting by creation date

### Invoices Table
- `idx_invoices_mshs`: For looking up invoices by student ID
- `idx_invoices_invoice_number`: For invoice number lookups
- `idx_invoices_invoice_date`: For filtering by date
- `idx_invoices_status`: For filtering by status
- `idx_invoices_created_at`: For sorting by creation date

### Classes Table
- `idx_classes_grade`: For filtering classes by grade
- `idx_classes_name`: For name-based lookups

### Tuition Groups Table
- `idx_tuition_groups_grade`: For filtering by grade
- `idx_tuition_groups_code`: For code-based lookups
- `idx_tuition_groups_month_apply`: For filtering by applicable month

### Outstanding Debts Table
- `idx_outstanding_debts_year`: For filtering by year

## When to Use Indexes

Indexes are most effective when:

1. The table has a large number of rows
2. The column is frequently used in WHERE clauses
3. The column has high cardinality (many unique values)
4. The column is used in JOIN conditions
5. The column is used in ORDER BY or GROUP BY clauses

## Monitoring Index Usage

To check if your indexes are being used effectively:

```sql
SELECT 
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM 
    pg_stat_user_indexes
JOIN 
    pg_stat_user_tables ON pg_stat_user_indexes.relid = pg_stat_user_tables.relid
ORDER BY 
    idx_scan DESC;
```

## Additional Optimization Techniques

Beyond indexes, consider these optimization techniques:

1. **Query Optimization**:
   - Use EXPLAIN ANALYZE to identify slow queries
   - Rewrite queries to use indexes effectively
   - Avoid SELECT * and only retrieve needed columns

2. **Database Configuration**:
   - Adjust PostgreSQL configuration parameters for your workload
   - Consider increasing shared_buffers, work_mem, and effective_cache_size

3. **Application-Level Caching**:
   - Cache frequently accessed data
   - Use Laravel's built-in caching mechanisms

4. **Regular Maintenance**:
   - Run VACUUM and ANALYZE regularly
   - Monitor and remove unused indexes

## Running the Migration

To apply these indexes to your database:

```bash
# Run the migration directly
php artisan migrate --path=database/migrations/2023_05_03_000000_add_comprehensive_indexes.php

# Or use the helper script
./run-indexes.sh
```

## Troubleshooting

If you encounter issues with the indexes:

1. Check if the tables exist before creating indexes
2. Ensure you have sufficient privileges on the database
3. Monitor query performance before and after adding indexes
4. Remove indexes that aren't being used