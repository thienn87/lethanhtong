# Hardcoded Hostnames in Backend Code

## Files with hardcoded "localhost" references:

1. **routes/api.php**:
   - Line ~70: `$fileUrl = 'http://localhost:9000/' . $fileName;`
   - Line ~100: `$fileUrl = 'http://localhost:9000/' . $fileName;`
   - Line ~290: `$fileUrl = 'http://localhost:9000/invoice-'.$date.'.xlsx';`
   - Line ~294: `$fileUrl = 'http://localhost:9000/invoice.xlsx';`

2. **app/Jobs/ExportInvoiceJob.php**:
   - Contains references to `http://localhost:9000/` for file URLs

3. **app/Jobs/ExportStudentsJob.php**:
   - Contains references to `http://localhost:9000/` for file URLs

4. **app/Jobs/ExportStudentsJobFilter.php**:
   - Contains references to `http://localhost:9000/` for file URLs

5. **app/Http/Controllers/TransactionController.php**:
   - May contain hardcoded URLs in export methods

6. **app/Http/Controllers/InvoiceController.php**:
   - May contain hardcoded URLs in export methods

7. **resources/views/emails/export-complete.blade.php**:
   - May contain hardcoded download URLs

## Recommended Replacement Pattern

Replace all instances of:
```php
'http://localhost:9000/' . $fileName
```

With:
```php
config('app.url') . '/' . $fileName
```

This uses Laravel's configuration system to get the application URL, making your code more portable across different environments.

## Configuration Setup

1. Ensure your `.env` file has the correct APP_URL setting:
   ```
   APP_URL=http://your-domain.com
   ```

2. Verify that `config/app.php` is properly using this environment variable:
   ```php
   'url' => env('APP_URL', 'http://localhost'),
   ```

3. For different environments, update the `.env` file accordingly:
   - Development: `APP_URL=http://localhost:9000`
   - Staging: `APP_URL=https://staging.your-domain.com`
   - Production: `APP_URL=https://your-domain.com`