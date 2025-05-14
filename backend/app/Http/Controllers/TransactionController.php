<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

use App\Repositories\TransactionRepository;
use App\Services\SearchService;
use App\Models\Transaction;
use Carbon\Carbon;

class TransactionController extends Controller
{   
    protected $outstandingDebtService;
    protected $transactionRepository;
    protected $searchService;

    /**
     * TransactionController constructor
     * 
     * @param TransactionRepository $transactionRepository
     * @param SearchService $searchService
     */
    public function __construct(
        TransactionRepository $transactionRepository,
        SearchService $searchService,
    ) {
        $this->transactionRepository = $transactionRepository;
        $this->searchService = $searchService;
    }
    /**
     * Update outstanding debt for all students for a specific month
     * This moves the processing from frontend to backend for better performance
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    // public function updateOutstandingDebtBatch(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'month' => 'required|integer|min:1|max:12',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => $validator->errors()->first(),
    //         ], 400);
    //     }

    //     $month = $request->input('month');
        
    //     try {
    //         // Get all active students
    //         $students = Student::where('leave_school', false)
    //             ->whereNotIn('class', ['E30', 'A30', 'E35', 'B35', 'B30', 'A35'])
    //             ->where('grade', '!=', '13')
    //             ->select('id', 'mshs', 'name', 'sur_name', 'grade', 'class')
    //             ->orderBy('grade')
    //             ->orderBy('class')
    //             ->get();
                
    //         $totalStudents = $students->count();
            
    //         // Create a response stream for real-time updates
    //         return response()->stream(function () use ($students, $month, $totalStudents) {
    //             // Start output buffering
    //             ob_start();
                
    //             // Send initial response
    //             echo "event: start\n";
    //             echo "data: " . json_encode([
    //                 'status' => 'processing',
    //                 'message' => "Starting to process $totalStudents students",
    //                 'totalStudents' => $totalStudents
    //             ]) . "\n\n";
                
    //             // Flush the buffer
    //             ob_end_flush();
    //             flush();
                
    //             $processedCount = 0;
    //             $successCount = 0;
    //             $errorCount = 0;
    //             $batchSize = 10;
                
    //             // Process students in batches
    //             foreach ($students->chunk($batchSize) as $batch) {
    //                 // Start output buffering for each batch
    //                 ob_start();
                    
    //                 $batchResults = [];
                    
    //                 foreach ($batch as $student) {
    //                     $result = $this->processStudentDebt($student, $month);
    //                     $batchResults[] = $result;
                        
    //                     if ($result['success']) {
    //                         // Only increment success count if records were actually updated (not skipped)
    //                         if (!isset($result['skipped']) || !$result['skipped']) {
    //                             $successCount += isset($result['count']) ? $result['count'] : 1;
    //                         }
    //                     } else {
    //                         $errorCount++;
    //                     }
                        
    //                     $processedCount++;
                        
    //                     // Send progress update every student
    //                     echo "event: progress\n";
    //                     echo "data: " . json_encode([
    //                         'status' => 'processing',
    //                         'processedCount' => $processedCount,
    //                         'totalStudents' => $totalStudents,
    //                         'successCount' => $successCount,
    //                         'errorCount' => $errorCount,
    //                         'progress' => round(($processedCount / $totalStudents) * 100),
    //                         'lastResult' => $result
    //                     ]) . "\n\n";
    //                 }
                    
    //                 // Flush the buffer for this batch
    //                 ob_end_flush();
    //                 flush();
                    
    //                 // Small delay between batches to prevent server overload
    //                 usleep(100000); // 100ms
    //             }
                
    //             // Start output buffering for completion event
    //             ob_start();
                
    //             // Send completion event
    //             echo "event: complete\n";
    //             echo "data: " . json_encode([
    //                 'status' => 'completed',
    //                 'message' => "Completed processing $totalStudents students",
    //                 'processedCount' => $processedCount,
    //                 'successCount' => $successCount,
    //                 'errorCount' => $errorCount
    //             ]) . "\n\n";
                
    //             // Flush the final buffer
    //             ob_end_flush();
    //             flush();
                
    //         }, 200, [
    //             'Cache-Control' => 'no-cache',
    //             'Content-Type' => 'text/event-stream',
    //             'X-Accel-Buffering' => 'no', // Disable nginx buffering
    //             'Connection' => 'keep-alive'
    //         ]);
    //     } catch (\Exception $e) {
    //         Log::error('Error updating outstanding debt batch: ' . $e->getMessage());
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Failed to update outstanding debt: ' . $e->getMessage(),
    //         ], 500);
    //     }
    // }
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

    public function debt(Request $request)
    {
        // Implementation needed
        return response()->json([
            'status' => 'error',
            'message' => 'Not implemented yet'
        ], 501);
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
        if (!isset($data['created_at']) || !$data['created_at']) {
            $createdAt = Carbon::now('Asia/Bangkok');
        } else {
            $createdAt = Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok');
        }
        

        try {
            DB::beginTransaction();
            
            $data_loop = $request->input('data');
            $results = [];
            $affectedStudents = [];
            
            foreach ($data_loop as $data) {
                if (!isset($data['created_at']) || !$data['created_at']) {
                    $createdAt = Carbon::now('Asia/Bangkok');
                } else {
                    $createdAt = Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok');
                }
                $data['year_month'] = $createdAt->format('Y-m');
                
                if ($validator->fails()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $validator->errors()->first(),
                    ], 400);
                }
                $result = $this->transactionRepository->createTransaction($data);
                $results[] = $result;
                
                // Track affected students for cache clearing
                if (!in_array($data['mshs'], $affectedStudents)) {
                    $affectedStudents[] = $data['mshs'];
                }
            }
            
            DB::commit();
            
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
            if (!isset($data['created_at']) || !$data['created_at']) {
                $createdAt = Carbon::now('Asia/Bangkok');
            } else {
                $createdAt = Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok');
            }
            $data['year_month'] = $createdAt->format('Y-m');
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
            if (!isset($data['created_at']) || !$data['created_at']) {
                $createdAt = Carbon::now('Asia/Bangkok');
            } else {
                $createdAt = Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok');
            }
            $data['year_month'] = $createdAt->format('Y-m');

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
}
