<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

use App\Repositories\TransactionRepository;
use App\Services\OutstandingDebtService;
use App\Services\SearchService;
use App\Services\StudentBalanceService;

use App\Models\Student;
use App\Models\Transaction;
use App\Models\TuitionGroup;
use App\Models\OutstandingDebt;
use Carbon\Carbon;

class TransactionController extends Controller
{   
    protected $outstandingDebtService;
    protected $transactionRepository;
    protected $searchService;
    protected $studentBalanceService;

    /**
     * TransactionController constructor
     * 
     * @param OutstandingDebtService $outstandingDebtService
     * @param TransactionRepository $transactionRepository
     * @param SearchService $searchService
     * @param StudentBalanceService $studentBalanceService
     */
    public function __construct(
        OutstandingDebtService $outstandingDebtService,
        TransactionRepository $transactionRepository,
        SearchService $searchService,
        StudentBalanceService $studentBalanceService
    ) {
        $this->outstandingDebtService = $outstandingDebtService;
        $this->transactionRepository = $transactionRepository;
        $this->searchService = $searchService;
        $this->studentBalanceService = $studentBalanceService;
    }

    public function exportOutstandingDebt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'required|integer',
            'revenue' => 'required',
            'outstandingdebt' => 'required',
            'debt' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        $data = [
            'year' => $request->input('year'),
            'revenue' => $request->input('revenue'),
            'outstandingdebt' => $request->input('outstandingdebt'),
            'debt' => $request->input('debt'),
        ];
        
        try {
            $existingRecord = OutstandingDebt::where('year', $data['year'])->first();

            if ($existingRecord) {
                $existingRecord->update($data);
            } else {
                OutstandingDebt::create($data);
            }

            return response()->json([
                'status' => 'success',
                'message' => $existingRecord ? 'Updated successfully' : 'Created successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error exporting outstanding debt: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save data: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getOldOutstandingDebt(Request $request)
    {
        try {
            $year = $request->input('year');
            
            if ($year) {
                $data = OutstandingDebt::where('year', $year)->first();
            } else {
                $data = OutstandingDebt::all();
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting old outstanding debt: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve data: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Update outstanding debt for all students for a specific month
     * This moves the processing from frontend to backend for better performance
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateOutstandingDebtBatch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'required|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        $month = $request->input('month');
        
        try {
            // Get all active students
            $students = Student::where('leave_school', false)
                ->where(function ($query) {
                    $query->where('class', '!=', 'E30')
                        ->where('class', '!=', 'A30')
                        ->where('class', '!=', 'E35')
                        ->where('class', '!=', 'B35')
                        ->where('class', '!=', 'B30')
                        ->where('class', '!=', 'A35')
                        ->where('grade', '!=', 'LT');
                })
                ->select('id', 'mshs', 'name', 'sur_name', 'grade', 'class')
                ->orderBy('grade')
                ->orderBy('class')
                ->get();
                
            $totalStudents = $students->count();
            
            // Create a response stream for real-time updates
            return response()->stream(function () use ($students, $month, $totalStudents) {
                // Start output buffering
                ob_start();
                
                // Send initial response
                echo "event: start\n";
                echo "data: " . json_encode([
                    'status' => 'processing',
                    'message' => "Starting to process $totalStudents students",
                    'totalStudents' => $totalStudents
                ]) . "\n\n";
                
                // Flush the buffer
                ob_end_flush();
                flush();
                
                $processedCount = 0;
                $successCount = 0;
                $errorCount = 0;
                $batchSize = 10;
                
                // Process students in batches
                foreach ($students->chunk($batchSize) as $batch) {
                    // Start output buffering for each batch
                    ob_start();
                    
                    $batchResults = [];
                    
                    foreach ($batch as $student) {
                        $result = $this->processStudentDebt($student, $month);
                        $batchResults[] = $result;
                        
                        if ($result['success']) {
                            // Only increment success count if records were actually updated (not skipped)
                            if (!isset($result['skipped']) || !$result['skipped']) {
                                $successCount += isset($result['count']) ? $result['count'] : 1;
                            }
                        } else {
                            $errorCount++;
                        }
                        
                        $processedCount++;
                        
                        // Send progress update every student
                        echo "event: progress\n";
                        echo "data: " . json_encode([
                            'status' => 'processing',
                            'processedCount' => $processedCount,
                            'totalStudents' => $totalStudents,
                            'successCount' => $successCount,
                            'errorCount' => $errorCount,
                            'progress' => round(($processedCount / $totalStudents) * 100),
                            'lastResult' => $result
                        ]) . "\n\n";
                    }
                    
                    // Flush the buffer for this batch
                    ob_end_flush();
                    flush();
                    
                    // Small delay between batches to prevent server overload
                    usleep(100000); // 100ms
                }
                
                // Start output buffering for completion event
                ob_start();
                
                // Send completion event
                echo "event: complete\n";
                echo "data: " . json_encode([
                    'status' => 'completed',
                    'message' => "Completed processing $totalStudents students",
                    'processedCount' => $processedCount,
                    'successCount' => $successCount,
                    'errorCount' => $errorCount
                ]) . "\n\n";
                
                // Flush the final buffer
                ob_end_flush();
                flush();
                
            }, 200, [
                'Cache-Control' => 'no-cache',
                'Content-Type' => 'text/event-stream',
                'X-Accel-Buffering' => 'no', // Disable nginx buffering
                'Connection' => 'keep-alive'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating outstanding debt batch: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update outstanding debt: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function index(Request $request)
    {   
        try {
            $perPage = (int) $request->input('per_page', 10);
            $page = (int) $request->input('page', 1);
            
            // Use more efficient query with select to limit data transfer
            $data = Transaction::select('id', 'mshs', 'student_name', 'paid_code', 'amount_paid', 'payment_date', 'note', 'created_at')
                ->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();
                
            $total = Transaction::count();
            
            return response()->json([
                'status' => 'success',
                'data' => $data,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => ceil($total / $perPage)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving transactions: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve transactions: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function search(Request $request)
    {   
        try {
            $data = $this->searchService->Transaction($request);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching transactions: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to search transactions: ' . $e->getMessage(),
            ], 500);
        }
    }
    // Add this method to your TransactionController class

    /**
     * Fix the PostgreSQL sequence for the transactions table
     * This is a maintenance endpoint to resolve ID conflicts
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function fixSequence()
    {
        try {
            $result = $this->transactionRepository->fixSequence();
            
            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Transaction sequence fixed successfully'
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to fix transaction sequence'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error fixing transaction sequence: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fix transaction sequence: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Get outstanding debt details for a specific student
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function outstandingDebtSingle(Request $request)
    {
        $mshs = $request->input('mshs');
        $month = $request->input('month');
        $useCaching = $request->input('use_caching', false);
        
        if (!$mshs) {
            return response()->json([
                'status' => 'error',
                'message' => 'Need MSHS parameter',
            ], 400);
        }
        
        try {
            // Check if student exists first (fast query with index)
            $studentExists = Student::where('mshs', $mshs)->exists();
            
            if (!$studentExists) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found'
                ], 404);
            }
            
            $data = null;
            
            // Only use caching when explicitly requested (for batch operations)
            if ($useCaching) {
                // Create a cache key that includes the month if provided
                $cacheKey = 'outstanding_debt_single_' . $mshs;
                if ($month) {
                    $cacheKey .= '_' . $month;
                }
                $cacheDuration = 5; // minutes
                
                // Use caching for batch operations
                if (Cache::has($cacheKey)) {
                    $data = Cache::get($cacheKey);
                    Log::info("Cache hit for MSHS {$mshs}" . ($month ? " month {$month}" : ""));
                } else {
                    // Start measuring execution time
                    $startTime = microtime(true);
                    
                    // Get the data with the optional month parameter
                    $data = $this->outstandingDebtService->single($mshs, $month);
                    
                    // Cache the result
                    Cache::put($cacheKey, $data, $cacheDuration * 60);
                    
                    // Log execution time for monitoring
                    $executionTime = microtime(true) - $startTime;
                    $monthInfo = $month ? " for month {$month}" : "";
                    Log::info("Outstanding debt single query for MSHS {$mshs}{$monthInfo} took {$executionTime} seconds");
                }
            } else {
                // For regular requests, don't use caching to ensure fresh data
                $data = $this->outstandingDebtService->single($mshs, $month);
            }
            
            if (!$data) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to retrieve student data'
                ], 500);
            }
            
            // Use a more efficient response (avoid unnecessary JSON encoding/decoding)
            return response()->json([
                'status' => 'success', 
                'data' => $data
            ], 200, [
                'Cache-Control' => 'public, max-age=300', // Allow browser caching for 5 minutes
                'Content-Type' => 'application/json'
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting outstanding debt for student: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve outstanding debt: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function outstandingDebt(Request $request)
    {
        try {
            // Cache the result for better performance
            $cacheKey = 'outstanding_debt_index';
            $cacheDuration = 30; // minutes
            
            $data = Cache::remember($cacheKey, $cacheDuration * 60, function () {
                return $this->outstandingDebtService->index();
            });

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting outstanding debt: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve outstanding debt: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function debt(Request $request)
    {
        // Implementation needed
        return response()->json([
            'status' => 'error',
            'message' => 'Not implemented yet'
        ], 501);
    }

    public function revert(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required',
            'month' => 'required|integer',
            'amount' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            $student = Student::where('mshs', $request->input('mshs'))->first();

            if (!$student) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Student not found with provided MSHS'
                ], 404);
            }

            $status = $this->transactionRepository->revertTransaction($request->all());
            
            // Clear cache for this student
            Cache::forget('outstanding_debt_single_' . $request->input('mshs'));

            return response()->json([
                'status' => 'success',
                'data' => $status
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error reverting transaction: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to revert transaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a batch of transactions
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateBatch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'data.*.mshs' => 'required',
            'data.*.paid_code' => 'required',
            'data.*.amount_paid' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            DB::beginTransaction();
            
            $data_loop = $request->input('data');
            $results = [];
            $affectedStudents = [];
            
            foreach ($data_loop as $data) {
                $result = $this->transactionRepository->createTransaction($data);
                $results[] = $result;
                
                // Track affected students for cache clearing
                if (!in_array($data['mshs'], $affectedStudents)) {
                    $affectedStudents[] = $data['mshs'];
                }
            }
            
            DB::commit();
            
            // Clear cache for affected students
            foreach ($affectedStudents as $mshs) {
                // Clear all cache keys related to this student
                Cache::forget('outstanding_debt_single_' . $mshs);
                
                // Clear month-specific caches
                for ($month = 1; $month <= 12; $month++) {
                    Cache::forget('outstanding_debt_single_' . $mshs . '_' . $month);
                }
                
                // Clear any student balance cache
                Cache::forget('student_balance_' . $mshs);
            }
            
            // Also clear any search caches that might contain these students
            $this->clearSearchCaches();

            return response()->json([
                'status' => 'success',
                'data' => $results
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating batch transactions: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update batch transactions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear search-related caches
     */
    private function clearSearchCaches()
    {
        // Clear outstanding debt search caches
        $keys = Cache::get('cache_keys_outstanding_debt_search', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::put('cache_keys_outstanding_debt_search', [], 60 * 60); // Reset the list
        
        // Clear student debts search caches
        $keys = Cache::get('cache_keys_student_debts_search', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::put('cache_keys_student_debts_search', [], 60 * 60); // Reset the list
        
        // Clear the main outstanding debt cache
        Cache::forget('outstanding_debt_index');
    }

    /**
     * Track a cache key for later clearing
     *
     * @param string $type The type of cache (e.g., 'outstanding_debt_search')
     * @param string $key The cache key to track
     */
    private function trackCacheKey($type, $key)
    {
        $cacheKeysKey = 'cache_keys_' . $type;
        $keys = Cache::get($cacheKeysKey, []);
        if (!in_array($key, $keys)) {
            $keys[] = $key;
            Cache::put($cacheKeysKey, $keys, 60 * 60 * 24); // Store for 24 hours
        }
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required',
            'paid_code' => 'required',
            'amount_paid' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            $data = $request->all();
            $data['amount_paid'] = is_numeric($request->amount_paid) ? $request->amount_paid : 0;

            $status = $this->transactionRepository->createTransaction($data);

            // Clear cache for this student
            Cache::forget('outstanding_debt_single_' . $request->input('mshs'));

            return response()->json([
                'status' => 'success',
                'data' => $status
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating transaction: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update transaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required',
            'paid_code' => 'required',
            'amount_paid' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            $data = $request->all();
            $data['amount_paid'] = is_numeric($request->amount_paid) ? $request->amount_paid : 0;

            $result = $this->transactionRepository->createTransaction($data);
            
            // Clear cache for this student
            Cache::forget('outstanding_debt_single_' . $request->input('mshs'));

            return response()->json([
                'status' => 'success',
                'data' => $result
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error creating transaction: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create transaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function exportFileExcel(Request $request)
    {
        return response()->json([
            'status' => 'success'
        ]);
    }

    public function exportFilePDF(Request $request)
    {
        return response()->json([
            'status' => 'success'
        ]);
    }

    /**
     * Search outstanding debt records with filters
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function searchOutstandingDebt(Request $request)
    {
        try {
            $year = $request->input('year', Carbon::now()->year);
            $month = $request->input('month');
            $grade = $request->input('grade');
            $keyword = $request->input('keyword');
            
            // Cache key based on search parameters
            $cacheKey = 'outstanding_debt_search_' . md5(json_encode([
                'year' => $year,
                'month' => $month,
                'grade' => $grade,
                'keyword' => $keyword
            ]));
            
            // Cache duration in minutes
            $cacheDuration = 5;
            
            // Get data from cache or execute query
            $data = Cache::remember($cacheKey, $cacheDuration * 60, function () use ($year, $month, $grade, $keyword) {
                // Get the base data from the OutstandingDebtService
                $allData = $this->outstandingDebtService->index();
                
                // Filter by year (if needed)
                $filteredData = collect($allData);
                
                // Filter by month if provided
                if ($month) {
                    $filteredData = $filteredData->filter(function($item) use ($month) {
                        return $item['month'] == (int)$month;
                    });
                }
                
                // Filter by grade if provided
                if ($grade) {
                    $filteredData = $filteredData->map(function($item) use ($grade) {
                        $filteredItem = $item;
                        $filteredItem['grades'] = collect($item['grades'])->filter(function($g) use ($grade) {
                            return $g['grade'] === $grade;
                        })->values()->toArray();
                        
                        // Recalculate totals for the filtered grades
                        $filteredItem['totalRevenue'] = collect($filteredItem['grades'])->sum('revenue');
                        $filteredItem['totalOutstandingDebt'] = collect($filteredItem['grades'])->sum('outstandingDebt');
                        
                        return $filteredItem;
                    })->filter(function($item) {
                        return count($item['grades']) > 0;
                    });
                }
                
                // Filter by keyword if provided
                if ($keyword) {
                    // This would require additional data about students that might not be available
                    // in the current structure. We might need to enhance the OutstandingDebtService
                    // to include student details in the response.
                    
                    // For now, we'll just return the data filtered by year, month, and grade
                    Log::info("Keyword search not fully implemented for outstanding debt search");
                }
                
                return $filteredData->values()->toArray();
            });
            
            return response()->json([
                'success' => true, 
                'data' => $data
            ]);
        } catch (\Exception $error) {
            Log::error('Error searching outstanding debt records: ' . $error->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Server error', 
                'error' => $error->getMessage()
            ], 500);
        }
    }
    /**
     * Search for student debts with pagination and filtering
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchStudentDebts(Request $request)
    {
        try {
            // Get search parameters with proper defaults
            $keyword = trim($request->input('keyword', ''));
            $grade = trim($request->input('grade', ''));
            $className = trim($request->input('class', ''));
            $year = (int)$request->input('year', Carbon::now()->year);
            $month = (int)$request->input('month', Carbon::now()->month);
            $page = max(1, (int)$request->input('page', 1)); // Ensure page is at least 1
            $limit = min(100, max(10, (int)$request->input('limit', 50))); // Limit between 10 and 100
            
            // Calculate offset
            $offset = ($page - 1) * $limit;
            
            // Cache key based on search parameters
            $cacheKey = 'student_debts_search_' . md5(json_encode([
                'page' => $page,
                'limit' => $limit,
                'keyword' => $keyword,
                'grade' => $grade,
                'class' => $className,
                'year' => $year,
                'month' => $month
            ]));
            
            // Track this cache key for later clearing
            $this->trackCacheKey('student_debts_search', $cacheKey);
            
            // Cache duration in minutes - shorter for frequently changing data
            $cacheDuration = 3;
            
            // Get data from cache or execute query
            $result = Cache::remember($cacheKey, $cacheDuration * 60, function () use ($offset, $limit, $keyword, $grade, $className, $year, $month, $page) {
                // Build base query with only necessary columns for better performance
                $query = DB::table('students')
                    ->leftJoin('student_balance', 'students.mshs', '=', 'student_balance.mshs')
                    ->where('students.leave_school', false)
                    ->select(
                        'students.mshs',
                        'students.name',
                        'students.sur_name',
                        'students.grade',
                        'students.class',
                        'student_balance.balance',
                        'student_balance.detail'
                    );
                    
                // Apply filters
                if (!empty($keyword)) {
                    // Use a more efficient search pattern
                    $cleanedKeyword = $this->searchService->removeVietnameseAccent(strtolower($keyword));
                    
                    $query->where(function($q) use ($keyword, $cleanedKeyword) {
                        $q->where('students.mshs', 'like', "%{$keyword}%")
                        ->orWhereRaw('LOWER(students.name) like ?', ["%{$cleanedKeyword}%"])
                        ->orWhereRaw('LOWER(students.sur_name) like ?', ["%{$cleanedKeyword}%"])
                        // Fix: Use PostgreSQL-compatible string concatenation with a space
                        ->orWhereRaw("LOWER(CONCAT(students.sur_name, ' ', students.name)) like ?", ["%{$cleanedKeyword}%"]);
                    });
                }
                
                if (!empty($grade)) {
                    $query->where('students.grade', $grade);
                }
                
                if (!empty($className)) {
                    $query->where('students.class', $className);
                }
                
                // Count total records for pagination - use optimized count query
                $totalCount = $query->count();
                
                // Get paginated results with efficient sorting
                $students = $query
                    ->orderBy('students.grade')
                    ->orderBy('students.class')
                    ->orderBy('students.name')
                    ->offset($offset)
                    ->limit($limit)
                    ->get();
                
                // Collect all MSHS values for efficient transaction querying
                $mshsValues = $students->pluck('mshs')->toArray();
                
                // Get all transactions for these students in the selected month/year in a single query
                $transactions = DB::table('transactions')
                    ->whereIn('mshs', $mshsValues)
                    ->where('payment_date', $month) // payment_date is just the month number
                    ->whereYear('created_at', $year) // Filter by year from created_at
                    ->select('mshs', 'amount_paid')
                    ->get();
                
                // Group transactions by MSHS for faster lookup
                $transactionsByMshs = [];
                foreach ($transactions as $transaction) {
                    if (!isset($transactionsByMshs[$transaction->mshs])) {
                        $transactionsByMshs[$transaction->mshs] = 0;
                    }
                    $transactionsByMshs[$transaction->mshs] += $transaction->amount_paid;
                }
                
                // Process results to match the expected format in the frontend
                $processedStudents = [];
                foreach ($students as $student) {
                    // Get paid amount for this student from the grouped transactions
                    $paidAmount = isset($transactionsByMshs[$student->mshs]) ? $transactionsByMshs[$student->mshs] : 0;
                    
                    // Get student balance details
                    $balanceDetail = json_decode($student->detail ?? '{}', true);
                    
                    // Calculate opening balance (previous month's balance)
                    $openingBalance = 0;
                    if (!empty($balanceDetail)) {
                        // Try to get the opening balance from the detail
                        if (isset($balanceDetail['by_code'])) {
                            // Sum all code balances
                            foreach ($balanceDetail['by_code'] as $codeBalance) {
                                $openingBalance += (float)$codeBalance;
                            }
                        }
                    }
                    
                    // Calculate monthly balance
                    $monthlyBalance = $openingBalance - $paidAmount;
                    
                    // Calculate total balance (from student_balance table)
                    $totalBalance = (float)($student->balance ?? 0);
                    
                    // Create a full name
                    $fullName = trim($student->sur_name . ' ' . $student->name);
                    
                    // Add to processed results with the exact field names expected by the frontend
                    $processedStudents[] = [
                        'mshs' => $student->mshs,
                        'ten' => $fullName,
                        'khoi' => $student->grade,
                        'lop' => $student->class,
                        'du_cuoi_thang_truoc' => $openingBalance,
                        'dathu' => $paidAmount,
                        'du_cuoi_thang_nay' => $monthlyBalance,
                        'tong_du_cuoi' => $totalBalance,
                        'year' => $year,
                        'month' => $month
                    ];
                }
                
                return [
                    'data' => $processedStudents,
                    'totalCount' => $totalCount,
                    'page' => $page,
                    'limit' => $limit,
                    'totalPages' => ceil($totalCount / $limit)
                ];
            });
            
            // Log cache hit/miss for monitoring
            $cacheHit = Cache::has($cacheKey);
            Log::info("Student debts search cache " . ($cacheHit ? "hit" : "miss") . " for key: {$cacheKey}");
            
            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'totalCount' => $result['totalCount'],
                'page' => $result['page'],
                'limit' => $result['limit'],
                'totalPages' => $result['totalPages']
            ]);
            
        } catch (\Exception $error) {
            Log::error('Error searching student debts: ' . $error->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Server error', 
                'error' => $error->getMessage()
            ], 500);
        }
    }

    
    /**
     * Process outstanding debt for a single student
     * 
     * @param  \App\Models\Student  $student
     * @param  int  $month
     * @return array
     */
    private function processStudentDebt($student, $month)
    {
        try {
            // Get student debt details using the OutstandingDebtService with the specified month
            // Use caching for batch operations to improve performance
            $cacheKey = 'outstanding_debt_single_' . $student->mshs . '_' . $month;
            $cacheDuration = 5; // minutes
            
            $debtData = Cache::remember($cacheKey, $cacheDuration * 60, function () use ($student, $month) {
                return $this->outstandingDebtService->single($student->mshs, $month);
            });
            
            if (!$debtData) {
                return [
                    'success' => false,
                    'mshs' => $student->mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'message' => 'No debt data found'
                ];
            }
            
            // Check if da_thu is null or empty
            $shouldCreateTransactions = !isset($debtData['da_thu']) || 
                                    (is_array($debtData['da_thu']) && empty($debtData['da_thu']));
            
            // If da_thu is not empty, check if there are existing transactions for this month
            if (!$shouldCreateTransactions) {
                $existingTransactions = collect($debtData['da_thu'])->filter(function ($transaction) use ($month) {
                    return (int)$transaction['payment_date'] === (int)$month;
                });
                
                // If no transactions for this month, we should create them
                $shouldCreateTransactions = $existingTransactions->isEmpty();
                
                // If there are transactions for this month, skip this student
                if (!$shouldCreateTransactions) {
                    return [
                        'success' => true,
                        'mshs' => $student->mshs,
                        'name' => $student->sur_name . ' ' . $student->name,
                        'message' => 'Student already has transactions for this month',
                        'skipped' => true,
                        'count' => 0 // No records were updated
                    ];
                }
            }
            
            // Get tuition items to create transactions for
            $tuitionItems = [];
            if (isset($debtData['chi_tiet_phai_thu_thang_nay']) && isset($debtData['chi_tiet_phai_thu_thang_nay']['tuition_apply'])) {
                $tuitionItems = $debtData['chi_tiet_phai_thu_thang_nay']['tuition_apply'];
            }
            
            if (empty($tuitionItems)) {
                return [
                    'success' => true,
                    'mshs' => $student->mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'message' => 'No tuition items to update',
                    'skipped' => true,
                    'count' => 0 // No records were updated
                ];
            }
            
            // Create transactions for each tuition item
            $createdCount = 0;
            $errors = [];
            $totalDebtAmount = 0;
            
            // Start a database transaction to ensure all operations succeed or fail together
            DB::beginTransaction();
            
            try {
                foreach ($tuitionItems as $item) {
                    $amount_paid = 0 - $item['default_amount'];
                    $totalDebtAmount += $item['default_amount'];
                    
                    $transactionData = [
                        'mshs' => $student->mshs,
                        'paid_code' => $item['code'],
                        'amount_paid' => $amount_paid,
                        'payment_date' => $month,
                        'note' => "Cập nhật dư nợ tháng {$month}"
                    ];
                    
                    $this->transactionRepository->createTransaction($transactionData);
                    $createdCount++;
                }
                
                // Get the StudentBalanceService from the container
                $studentBalanceService = app(StudentBalanceService::class);
                
                // Update student balance for debt
                $studentBalanceService->updateBalanceForDebt($student->mshs, $totalDebtAmount, $tuitionItems);
                
                // Commit the transaction
                DB::commit();
                
                return [
                    'success' => true,
                    'mshs' => $student->mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'message' => "Created {$createdCount} transactions and updated balance successfully",
                    'count' => $createdCount, // Number of records updated
                    'skipped' => false
                ];
            } catch (\Exception $e) {
                // Roll back the transaction if anything fails
                DB::rollBack();
                
                Log::error("Error creating transactions for student {$student->mshs}: " . $e->getMessage());
                return [
                    'success' => false,
                    'mshs' => $student->mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'message' => "Error: " . $e->getMessage(),
                    'count' => 0 // No records were updated
                ];
            }
        } catch (\Exception $e) {
            Log::error("Error processing debt for student {$student->mshs}: " . $e->getMessage());
            return [
                'success' => false,
                'mshs' => $student->mshs,
                'name' => $student->sur_name . ' ' . $student->name,
                'message' => $e->getMessage(),
                'count' => 0 // No records were updated
            ];
        }
    }
    /**
     * Get detailed balance for a student
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetailedBalance(Request $request)
    {
        $mshs = $request->input('mshs');
        
        if (!$mshs) {
            return response()->json([
                'status' => 'error',
                'message' => 'Need MSHS parameter',
            ], 400);
        }
        
        try {
            // Check if student exists
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found'
                ], 404);
            }
            
            // Get student balance
            $studentBalance = DB::table('student_balance')
                ->where('mshs', $mshs)
                ->first();
            
            if (!$studentBalance) {
                // If no balance record exists, calculate it
                $outstandingDebt = $this->outstandingDebtService->single($mshs);
                
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'mshs' => $mshs,
                        'name' => $student->sur_name . ' ' . $student->name,
                        'balance' => $outstandingDebt['tong_du_cuoi'],
                        'detail' => $outstandingDebt['tong_du_cuoi_chi_tiet'] ?? null,
                        'advance_payment_info' => $outstandingDebt['advance_payment_info'] ?? null,
                    ]
                ]);
            }
            
            // Parse the detail JSON
            $detailedBalance = null;
            $advancePaymentInfo = null;
            
            if (isset($studentBalance->detail)) {
                $detailData = json_decode($studentBalance->detail, true);
                
                // Check if the detailed balance has the new format with advance months
                if (isset($detailData['by_code'])) {
                    $detailedBalance = $detailData['by_code'];
                    $advancePaymentInfo = [
                        'advance_months' => $detailData['advance_months'] ?? 0,
                        'monthly_fees' => $detailData['monthly_fees'] ?? 0,
                        'remaining_balance' => $detailData['remaining_balance'] ?? 0
                    ];
                } else {
                    $detailedBalance = $detailData;
                    
                    // Calculate advance payment info if not available
                    $currentMonth = intval(date('n'));
                    $debt = $this->outstandingDebtService->getDebtByMonth(
                        $currentMonth, 
                        $student->grade, 
                        $student->discount, 
                        null, 
                        $student->stay_in
                    );
                    
                    if ($studentBalance->balance > 0 && $debt['debt_with_discount'] > 0) {
                        $advanceMonths = floor($studentBalance->balance / $debt['debt_with_discount']);
                        $remainingBalance = $studentBalance->balance - ($advanceMonths * $debt['debt_with_discount']);
                        
                        $advancePaymentInfo = [
                            'advance_months' => $advanceMonths,
                            'monthly_fees' => $debt['debt_with_discount'],
                            'remaining_balance' => $remainingBalance
                        ];
                    }
                }
            }
            
            // Format the detail for display
            $formattedDetail = [];
            if (is_array($detailedBalance)) {
                foreach ($detailedBalance as $code => $amount) {
                    // Get tuition group name
                    $tuitionGroup = TuitionGroup::where('code', $code)->first();
                    $name = $tuitionGroup ? $tuitionGroup->name : $code;
                    
                    $formattedDetail[] = [
                        'code' => $code,
                        'name' => $name,
                        'amount' => $amount,
                        'formatted' => $code . ': ' . number_format($amount, 0, ',', '.')
                    ];
                }
            }
            
            // Format advance payment info for display
            $formattedAdvanceInfo = null;
            if ($advancePaymentInfo) {
                $formattedAdvanceInfo = [
                    'advance_months' => $advancePaymentInfo['advance_months'],
                    'monthly_fees' => $advancePaymentInfo['monthly_fees'],
                    'remaining_balance' => $advancePaymentInfo['remaining_balance'],
                    'formatted' => sprintf(
                        '%d tháng + %s',
                        $advancePaymentInfo['advance_months'],
                        number_format($advancePaymentInfo['remaining_balance'], 0, ',', '.')
                    )
                ];
            }
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'mshs' => $mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'balance' => $studentBalance->balance,
                    'detail' => $formattedDetail,
                    'advance_payment_info' => $formattedAdvanceInfo,
                    'updated_at' => $studentBalance->updated_at
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting detailed balance: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve detailed balance: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Update student balance based on outstanding debt data
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStudentBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required|string',
            'balance' => 'required|numeric',
            'detail' => 'nullable|array',
            'advance_payment_info' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            // Get the StudentBalanceService from the container
            $studentBalanceService = app(StudentBalanceService::class);
            
            // Update the student balance
            $result = $studentBalanceService->updateStudentBalance(
                $request->input('mshs'),
                $request->input('balance'),
                $request->input('detail'),
                $request->input('advance_payment_info')
            );
            
            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Student balance updated successfully',
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to update student balance',
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error updating student balance: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update student balance: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Get student balance details
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudentBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 400);
        }

        try {
            // Get the StudentBalanceService from the container
            $studentBalanceService = app(StudentBalanceService::class);
            
            // Get the student balance
            $balance = $studentBalanceService->getStudentBalance($request->input('mshs'));
            
            if ($balance) {
                return response()->json([
                    'status' => 'success',
                    'data' => $balance,
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student balance not found',
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error getting student balance: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get student balance: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Update all student balances based on current outstanding debt data
     * This is a bulk operation that updates the student_balance table for all students
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAllStudentBalances()
    {
        try {
            // Get all active students
            $students = Student::where('leave_school', false)
                ->where(function ($query) {
                    $query->where('class', '!=', 'E30')
                        ->where('class', '!=', 'A30')
                        ->where('class', '!=', 'E35')
                        ->where('class', '!=', 'B35')
                        ->where('class', '!=', 'B30')
                        ->where('class', '!=', 'A35')
                        ->where('grade', '!=', 'LT');
                })
                ->select('id', 'mshs', 'name', 'sur_name', 'grade', 'class', 'discount', 'stay_in')
                ->get();
            
            $totalStudents = $students->count();
            $updatedCount = 0;
            $errorCount = 0;
            $skippedCount = 0;
            
            // Get the StudentBalanceService from the container
            $studentBalanceService = app(StudentBalanceService::class);
            
            // Process each student
            foreach ($students as $student) {
                try {
                    // Get the student's outstanding debt data
                    $debtData = $this->outstandingDebtService->single($student->mshs);
                    
                    if (!$debtData) {
                        Log::warning("Could not retrieve debt data for student {$student->mshs}");
                        $skippedCount++;
                        continue;
                    }
                    
                    // Extract the balance information
                    $balance = $debtData['tong_du_cuoi'] ?? 0;
                    
                    // Check if we have detailed balance information
                    if (isset($debtData['tong_du_cuoi_chi_tiet']) && !empty($debtData['tong_du_cuoi_chi_tiet'])) {
                        // We have detailed balance, use it
                        $detailData = $debtData['tong_du_cuoi_chi_tiet'];
                    } else {
                        // Calculate detailed balance from scratch
                        $detailData = $studentBalanceService->calculateDetailedBalance($student, $balance);
                    }
                    
                    // Prepare advance payment info
                    $advancePaymentInfo = $debtData['advance_payment_info'] ?? null;
                    
                    // Update the student balance
                    $result = $studentBalanceService->updateStudentBalance(
                        $student->mshs,
                        $balance,
                        $detailData,
                        $advancePaymentInfo
                    );
                    
                    if ($result) {
                        $updatedCount++;
                        
                        // Log progress every 50 students
                        if ($updatedCount % 50 === 0) {
                            Log::info("Updated {$updatedCount}/{$totalStudents} student balances");
                        }
                    } else {
                        $errorCount++;
                        Log::warning("Failed to update balance for student {$student->mshs}");
                    }
                } catch (\Exception $e) {
                    Log::error("Error updating balance for student {$student->mshs}: " . $e->getMessage());
                    $errorCount++;
                }
            }
            
            return response()->json([
                'status' => 'success',
                'message' => "Updated balances for {$updatedCount} students",
                'totalStudents' => $totalStudents,
                'updatedCount' => $updatedCount,
                'skippedCount' => $skippedCount,
                'errorCount' => $errorCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating all student balances: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update student balances: ' . $e->getMessage(),
            ], 500);
        }
    }

}
