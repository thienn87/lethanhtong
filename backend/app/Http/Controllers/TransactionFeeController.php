<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Student;
use App\Services\OutstandingDebtService;
use App\Services\TransactionService;
use Illuminate\Support\Facades\DB;
class TransactionFeeController extends Controller
{
    protected $outstandingDebtService;
    protected $transactionService;

    public function __construct(OutstandingDebtService $outstandingDebtService, TransactionService $transactionService)
    {
        $this->outstandingDebtService = $outstandingDebtService;
        $this->transactionService = $transactionService;
    }

    /**
     * Get pre-calculated transaction fee data for a student
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTransactionFeeData(Request $request)
    {
        try {
            $mshs = $request->query('mshs');
            
            if (!$mshs) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student ID (mshs) is required'
                ], 400);
            }

            // Get student data
            $student = Student::where('mshs', $mshs)->first();
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found'
                ], 404);
            }

            // Get raw fee data
            $rawFeeData = $this->outstandingDebtService->single($mshs);
            
            // Process and calculate accurate fee data
            $processedData = $this->processTransactionFeeData($rawFeeData);
            
            // Get the next transaction ID
            $nextTransactionId = $this->getNextTransactionId();
            
            // Add the next transaction ID to the response
            $processedData['next_transaction_id'] = $nextTransactionId;
            
            return response()->json([
                'status' => 'success',
                'data' => $processedData
            ]);
        } catch (\Exception $e) {
            Log::error("Error getting transaction fee data: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get transaction fee data: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get the next transaction ID
     *
     * @return string
     */
    private function getNextTransactionId()
    {
        try {
            // Get the latest transaction ID
            $latestTransaction = DB::table('transactions')
                ->orderBy('id', 'desc')
                ->first();
            
            $nextId = $latestTransaction ? ($latestTransaction->id + 1) : 1;
            return str_pad($nextId, 5, '0', STR_PAD_LEFT);
        } catch (\Exception $e) {
            Log::error("Error getting next transaction ID: " . $e->getMessage());
            // Return a fallback ID based on timestamp if there's an error
            return date('ymdHi');
        }
    }

    /**
     * Process and calculate accurate fee data
     *
     * @param array $rawData
     * @return array
     */
    private function processTransactionFeeData($rawData)
    {
        $result = [
            'student' => $rawData['student'] ?? null,
            'chi_tiet_phai_thu_thang_nay' => $rawData['chi_tiet_phai_thu_thang_nay'] ?? null,
            'so_du_dau_ki' => $rawData['so_du_dau_ki'] ?? [],
            'da_thu' => $rawData['da_thu'] ?? [],
            'tong_du_cuoi' => $rawData['tong_du_cuoi'] ?? 0,
            'tong_du_cuoi_chi_tiet' => $rawData['tong_du_cuoi_chi_tiet'] ?? [],
            'processed_fees' => []
        ];

        // Get current month fees
        $currentMonthFees = $rawData['chi_tiet_phai_thu_thang_nay']['tuition_apply'] ?? [];
        
        foreach ($currentMonthFees as $fee) {
            $feeCode = $fee['code'];
            
            // Calculate total paid amount for this fee code
            $totalPaidAmount = $this->calculateTotalPaidAmount($rawData['da_thu'] ?? [], $feeCode);
            
            // Get opening debt balance for this fee code
            $openingDebtBalance = $this->getOpeningDebtBalance($rawData['tong_du_cuoi_chi_tiet'] ?? [], $feeCode);
            
            // Calculate remaining amount
            $remainingAmount = ($openingDebtBalance + $totalPaidAmount) - (float)($fee['default_amount'] ?? 0);
            
            // Get the latest transaction note for this fee code
            $latestTransaction = $this->getLatestTransaction($rawData['da_thu'] ?? [], $feeCode);
            
            // Add processed fee data
            $result['processed_fees'][] = [
                'code' => $feeCode,
                'name' => $fee['name'] ?? '',
                'default_amount' => (float)($fee['default_amount'] ?? 0),
                'opening_debt_balance' => $openingDebtBalance,
                'total_paid_amount' => $totalPaidAmount,
                'remaining_amount' => $remainingAmount,
                'suggested_payment' => $remainingAmount < 0 ? abs($remainingAmount) : 0,
                'latest_note' => $latestTransaction ? ($latestTransaction['note'] ?? '') : '',
                'is_checked' => true
            ];
        }

        return $result;
    }

    /**
     * Calculate total paid amount for a specific fee code
     *
     * @param mixed $paidFees
     * @param string $code
     * @return float
     */
    private function calculateTotalPaidAmount($paidFees, $code)
    {
        // If paidFees is null or not iterable, return 0
        if ($paidFees === null) {
            return 0;
        }
        
        // Convert to array if it's an object
        if (is_object($paidFees) && !($paidFees instanceof \Traversable)) {
            $paidFees = (array)$paidFees;
        }
        
        // If it's a collection or array, iterate through it
        if (is_array($paidFees) || $paidFees instanceof \Traversable) {
            $total = 0;
            foreach ($paidFees as $fee) {
                // Check if the fee is an object (from Eloquent) or an array
                if (is_object($fee)) {
                    if (isset($fee->paid_code) && $fee->paid_code === $code) {
                        $total += (float)($fee->amount_paid ?? 0);
                    }
                } else {
                    if (isset($fee['paid_code']) && $fee['paid_code'] === $code) {
                        $total += (float)($fee['amount_paid'] ?? 0);
                    }
                }
            }
            return $total;
        }
        
        // If we can't process it, return 0
        return 0;
    }
    /**
     * Get opening debt balance for a specific fee code
     *
     * @param array $debtDetails
     * @param string $code
     * @return float
     */
    private function getOpeningDebtBalance($debtDetails, $code)
    {
        if (!is_array($debtDetails) || !isset($debtDetails[$code])) {
            return 0;
        }
        
        return (float)$debtDetails[$code];
    }

    /**
     * Get the latest transaction for a specific fee code
     *
     * @param mixed $paidFees
     * @param string $code
     * @return array|null
     */
    private function getLatestTransaction($paidFees, $code)
    {
        // If paidFees is null or not iterable, return null
        if ($paidFees === null) {
            return null;
        }
        
        // Convert to array if it's an object
        if (is_object($paidFees) && !($paidFees instanceof \Traversable)) {
            $paidFees = (array)$paidFees;
        }
        
        // If it's not an array or traversable at this point, return null
        if (!is_array($paidFees) && !($paidFees instanceof \Traversable)) {
            return null;
        }
        
        $filteredFees = [];
        
        // Filter fees by code, handling both object and array formats
        foreach ($paidFees as $fee) {
            if (is_object($fee)) {
                if (isset($fee->paid_code) && $fee->paid_code === $code) {
                    // Convert object to array for consistent handling
                    $filteredFees[] = (array)$fee;
                }
            } else {
                if (isset($fee['paid_code']) && $fee['paid_code'] === $code) {
                    $filteredFees[] = $fee;
                }
            }
        }
        
        if (empty($filteredFees)) {
            return null;
        }
        
        // Sort by created_at if available, otherwise by id
        usort($filteredFees, function($a, $b) {
            // Try created_at first
            if (isset($a['created_at']) && isset($b['created_at'])) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            }
            
            // Fall back to id if created_at is not available
            if (isset($a['id']) && isset($b['id'])) {
                return $b['id'] - $a['id'];
            }
            
            return 0;
        });
        
        return $filteredFees[0] ?? null;
    }
}