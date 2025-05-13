<?php
namespace App\Observers;

use App\Models\Student;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class StudentObserver
{
    /**
     * Handle the Student "created" event.
     *
     * @param  \App\Models\Student  $student
     * @return void
     */
    public function created(Student $student)
    {
        $this->clearSearchCache();
    }

    /**
     * Handle the Student "updated" event.
     *
     * @param  \App\Models\Student  $student
     * @return void
     */
    public function updated(Student $student)
    {
        $this->clearSearchCache();
    }

    /**
     * Handle the Student "deleted" event.
     *
     * @param  \App\Models\Student  $student
     * @return void
     */
    public function deleted(Student $student)
    {
        $this->clearSearchCache();
    }

    /**
     * Clear all student search related caches
     *
     * @return void
     */
    private function clearSearchCache()
    {
        try {
            // Try to use cache tags if supported by the driver
            if (Cache::supportsTags()) {
                Cache::tags(['student_search'])->flush();
                Log::info('Cleared student search cache using tags');
                return;
            }
            
            // For drivers that don't support tags (like file driver)
            // We need to use a different approach
            
            // Option 1: If you're using a prefix for your cache keys
            Cache::flush();
            Log::info('Flushed entire cache as tags are not supported');
            
            // Option 2: If you want to be more selective, you can use a pattern-based approach
            // This requires Redis or a similar driver that supports scanning/pattern matching
            // This is just a conceptual example - actual implementation depends on your cache driver
            /*
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*student_search_*');
                foreach ($keys as $key) {
                    // Extract the cache key from the Redis key
                    $cacheKey = str_replace(config('cache.prefix') . ':', '', $key);
                    Cache::forget($cacheKey);
                }
                Log::info('Cleared ' . count($keys) . ' student search cache keys using Redis pattern matching');
            } else {
                // For other drivers, we have to flush the entire cache
                Cache::flush();
                Log::info('Flushed entire cache as selective clearing is not supported');
            }
            */
        } catch (\Exception $e) {
            Log::error('Failed to clear student search cache: ' . $e->getMessage());
        }
    }
}
