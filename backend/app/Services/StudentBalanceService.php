<?php

namespace App\Services;

use App\Models\Student;
use App\Models\TuitionGroup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class StudentBalanceService
{
    protected $outstandingDebtService;

    public function __construct(OutstandingDebtService $outstandingDebtService)
    {
        $this->outstandingDebtService = $outstandingDebtService;
    }

    /**
     * Update or create a student balance record
     *
     * @param string $mshs Student ID
     * @param float $balance Total balance amount
     * @param array|null $detail Detailed breakdown of balance by tuition code
     * @param array|null $advancePaymentInfo Information about advance payments
     * @return bool Whether the operation was successful
     */
    public function updateStudentBalance($mshs, $balance, $detail = null, $advancePaymentInfo = null)
    {
        try {
            // Check if student exists
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                Log::error("Student not found with MSHS: {$mshs}");
                return false;
            }
            
            // Format the detail data for storage
            $detailData = $this->formatDetailData($detail, $advancePaymentInfo);
            
            // Update or create the student_balance record
            DB::table('student_balance')
                ->updateOrInsert(
                    ['mshs' => $mshs],
                    [
                        'balance' => $balance,
                        'detail' => !empty($detailData) ? json_encode($detailData) : null,
                        'updated_at' => now()
                    ]
                );
            
            // Clear cache for this student
            $this->clearStudentCache($mshs);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Error updating student balance for {$mshs}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get student balance details
     *
     * @param string $mshs Student ID
     * @return array|null Balance details or null if not found
     */
    public function getStudentBalance($mshs)
    {
        try {
            // Check if student exists
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                Log::error("Student not found with MSHS: {$mshs}");
                return null;
            }
            
            // Get student balance
            $studentBalance = DB::table('student_balance')
                ->where('mshs', $mshs)
                ->first();
            
            if (!$studentBalance) {
                // If no balance record exists, calculate it
                $outstandingDebt = $this->outstandingDebtService->single($mshs);
                
                return [
                    'mshs' => $mshs,
                    'name' => $student->sur_name . ' ' . $student->name,
                    'balance' => $outstandingDebt['tong_du_cuoi'] ?? 0,
                    'detail' => $outstandingDebt['tong_du_cuoi_chi_tiet'] ?? null,
                    'advance_payment_info' => $outstandingDebt['advance_payment_info'] ?? null,
                ];
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
            $formattedDetail = $this->formatDetailForDisplay($detailedBalance);
            
            // Format advance payment info for display
            $formattedAdvanceInfo = $this->formatAdvancePaymentInfo($advancePaymentInfo);
            
            return [
                'mshs' => $mshs,
                'name' => $student->sur_name . ' ' . $student->name,
                'balance' => $studentBalance->balance,
                'detail' => $formattedDetail,
                'advance_payment_info' => $formattedAdvanceInfo,
                'updated_at' => $studentBalance->updated_at
            ];
        } catch (\Exception $e) {
            Log::error("Error getting student balance for {$mshs}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Calculate detailed balance from scratch for a student
     *
     * @param \App\Models\Student $student Student model
     * @param float $balance Total balance amount
     * @return array Detailed balance data
     */
    public function calculateDetailedBalance($student, $balance)
    {
        // Get current month
        $currentMonth = intval(date('n'));
        
        // Get all tuition groups for this student's grade
        $tuitionGroups = TuitionGroup::where('grade', $student->grade)->get();
        
        // Initialize detail data
        $detailData = [];
        
        // Calculate monthly fees
        $monthlyFees = 0;
        foreach ($tuitionGroups as $group) {
            // Skip NT groups if stay_in is false
            if ($student->stay_in === false && $group->group === "NT") {
                continue;
            }
            
            // Check if this tuition applies to the current month
            $monthApply = $group->month_apply;
            if (!$monthApply) continue;
            
            $monthApplyArray = strpos($monthApply, ',') > 0 ? explode(",", $monthApply) : [$monthApply];
            if (in_array($currentMonth, $monthApplyArray)) {
                $amount = $group->default_amount;
                
                // Apply discount if applicable
                if (strpos($group->grade, "HP") > -1) {
                    $amountWithDiscount = $amount - ($amount * $student->discount / 100);
                } else {
                    $amountWithDiscount = $amount;
                }
                
                $detailData[$group->code] = 0; // Initialize with zero
                $monthlyFees += $amountWithDiscount;
            }
        }
        
        // If we have a positive balance, distribute it proportionally
        if ($balance > 0 && $monthlyFees > 0) {
            $advanceMonths = floor($balance / $monthlyFees);
            $remainingBalance = $balance - ($advanceMonths * $monthlyFees);
            
            // Distribute the balance proportionally
            foreach ($detailData as $code => $amount) {
                $tuitionGroup = $tuitionGroups->firstWhere('code', $code);
                if ($tuitionGroup) {
                    $tuitionAmount = $tuitionGroup->default_amount;
                    
                    // Apply discount if applicable
                    if (strpos($tuitionGroup->grade, "HP") > -1) {
                        $tuitionAmount = $tuitionAmount - ($tuitionAmount * $student->discount / 100);
                    }
                    
                    $proportion = $tuitionAmount / $monthlyFees;
                    $detailData[$code] = ($advanceMonths * $tuitionAmount) + ($remainingBalance * $proportion);
                }
            }
        }
        
        // Prepare advance payment info
        $advancePaymentInfo = [
            'advance_months' => $monthlyFees > 0 ? floor($balance / $monthlyFees) : 0,
            'monthly_fees' => $monthlyFees,
            'remaining_balance' => $monthlyFees > 0 ? $balance - (floor($balance / $monthlyFees) * $monthlyFees) : $balance
        ];
        
        // Prepare the final detail data structure
        return [
            'by_code' => $detailData,
            'advance_months' => $advancePaymentInfo['advance_months'],
            'monthly_fees' => $advancePaymentInfo['monthly_fees'],
            'remaining_balance' => $advancePaymentInfo['remaining_balance']
        ];
    }

    /**
     * Update student balance after invoice creation
     *
     * @param string $mshs Student ID
     * @param array $transactionData Array of transaction data with code and amount
     * @param int|null $month Payment month (optional)
     * @return bool Whether the operation was successful
     */
    public function updateBalanceAfterInvoice($mshs, $transactionData, $month = null)
    {
        try {
            // Check if student exists
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                Log::error("Student not found with MSHS: {$mshs}");
                return false;
            }
            
            // Get current month if not provided
            $currentMonth = $month ? intval($month) : intval(date('n'));
            
            // Get the student's debt information for the current month
            $debtInfo = $this->outstandingDebtService->single($mshs, $currentMonth);
            
            if (!$debtInfo) {
                Log::error("Failed to get debt information for student {$mshs}");
                return false;
            }
            
            // Get the current balance record
            $studentBalance = DB::table('student_balance')
                ->where('mshs', $mshs)
                ->first();
            
            // Calculate the new balance based on remaining amounts
            $newBalance = $this->calculateRemainingBalance($debtInfo, $transactionData);
            
            // Calculate detailed balance by code
            $detailedBalance = $this->calculateDetailedRemainingBalance($debtInfo, $transactionData);
            
            // Calculate advance payment info
            $advancePaymentInfo = $this->calculateAdvancePaymentInfo($student, $newBalance, $currentMonth);
            
            // Format the detail data for storage
            $detailData = [
                'by_code' => $detailedBalance,
                'advance_months' => $advancePaymentInfo['advance_months'],
                'monthly_fees' => $advancePaymentInfo['monthly_fees'],
                'remaining_balance' => $advancePaymentInfo['remaining_balance']
            ];
            
            // Update or create the student_balance record
            DB::table('student_balance')
                ->updateOrInsert(
                    ['mshs' => $mshs],
                    [
                        'balance' => $newBalance,
                        'detail' => json_encode($detailData),
                        'updated_at' => now()
                    ]
                );
            
            // Clear cache for this student
            $this->clearStudentCache($mshs);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Error updating student balance after invoice for {$mshs}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate the remaining balance after transactions
     *
     * @param array $debtInfo Debt information from OutstandingDebtService
     * @param array $transactionData Array of transaction data with code and amount
     * @return float The new balance
     */
    private function calculateRemainingBalance($debtInfo, $transactionData)
    {
        // Get the current total balance
        $currentBalance = $debtInfo['tong_du_cuoi'] ?? 0;
        
        // Calculate the total transaction amount
        $totalTransactionAmount = 0;
        foreach ($transactionData as $transaction) {
            if (isset($transaction['amount'])) {
                $totalTransactionAmount += (float)$transaction['amount'];
            }
        }
        
        // Calculate the new balance
        return $currentBalance + $totalTransactionAmount;
    }

    /**
     * Calculate detailed remaining balance by fee code
     *
     * @param array $debtInfo Debt information from OutstandingDebtService
     * @param array $transactionData Array of transaction data with code and amount
     * @return array Detailed balance by fee code
     */
    private function calculateDetailedRemainingBalance($debtInfo, $transactionData)
    {
        // Get the current detailed balance
        $currentDetailedBalance = $debtInfo['tong_du_cuoi_chi_tiet'] ?? [];
        
        // Convert to array if it's an object
        if (is_object($currentDetailedBalance)) {
            $currentDetailedBalance = (array)$currentDetailedBalance;
        }
        
        // Initialize the new detailed balance with the current values
        $newDetailedBalance = $currentDetailedBalance;
        
        // Update the balance for each transaction
        foreach ($transactionData as $transaction) {
            if (isset($transaction['code']) && isset($transaction['amount'])) {
                $code = $transaction['code'];
                $amount = (float)$transaction['amount'];
                
                // Initialize if the code doesn't exist
                if (!isset($newDetailedBalance[$code])) {
                    $newDetailedBalance[$code] = 0;
                }
                
                // Add the transaction amount to the balance for this code
                $newDetailedBalance[$code] += $amount;
            }
        }
        
        return $newDetailedBalance;
    }

    /**
     * Calculate advance payment information
     *
     * @param \App\Models\Student $student Student model
     * @param float $balance Total balance
     * @param int $currentMonth Current month (1-12)
     * @return array Advance payment information
     */
    private function calculateAdvancePaymentInfo($student, $balance, $currentMonth)
    {
        // Get the monthly fees for this student
        $debt = $this->outstandingDebtService->getDebtByMonth(
            $currentMonth, 
            $student->grade, 
            $student->discount, 
            null, 
            $student->stay_in
        );
        
        $monthlyFees = $debt['debt_with_discount'] ?? 0;
        
        // Calculate advance months
        $advanceMonths = $monthlyFees > 0 ? floor($balance / $monthlyFees) : 0;
        $remainingBalance = $monthlyFees > 0 ? $balance - ($advanceMonths * $monthlyFees) : $balance;
        
        return [
            'advance_months' => $advanceMonths,
            'monthly_fees' => $monthlyFees,
            'remaining_balance' => $remainingBalance
        ];
    }

    /**
     * Update student balance when adding a debt transaction
     *
     * @param string $mshs Student ID
     * @param float $debtAmount Amount of debt to add
     * @param array $tuitionItems Tuition items associated with the debt
     * @return bool Whether the operation was successful
     */
    public function updateBalanceForDebt($mshs, $debtAmount, $tuitionItems)
    {
        try {
            // Get student balance
            $studentBalance = DB::table('student_balance')->where('mshs', $mshs)->first();
            
            if ($studentBalance) {
                // If balance record exists, update it
                $newBalance = $studentBalance->balance - $debtAmount;
                
                DB::table('student_balance')
                    ->where('mshs', $mshs)
                    ->update([
                        'balance' => $newBalance,
                        'updated_at' => now()
                    ]);
                
                // If there's a detailed balance, update that too
                if (isset($studentBalance->detail) && !empty($studentBalance->detail)) {
                    $detailData = json_decode($studentBalance->detail, true);
                    
                    // If we have the new format with by_code
                    if (isset($detailData['by_code'])) {
                        $byCode = $detailData['by_code'];
                        $advanceMonths = $detailData['advance_months'] ?? 0;
                        $monthlyFees = $detailData['monthly_fees'] ?? 0;
                        $remainingBalance = $detailData['remaining_balance'] ?? 0;
                        
                        // Subtract one month if we have advance months
                        if ($advanceMonths > 0) {
                            $advanceMonths--;
                            $newDetailData = [
                                'by_code' => $byCode,
                                'advance_months' => $advanceMonths,
                                'monthly_fees' => $monthlyFees,
                                'remaining_balance' => $remainingBalance
                            ];
                            
                            DB::table('student_balance')
                                ->where('mshs', $mshs)
                                ->update([
                                    'detail' => json_encode($newDetailData),
                                    'updated_at' => now()
                                ]);
                        }
                    } else {
                        // For old format, just update each tuition code
                        foreach ($tuitionItems as $item) {
                            $code = is_array($item) ? $item['code'] : $item->code;
                            $amount = is_array($item) ? $item['default_amount'] : $item->default_amount;
                            
                            if (isset($detailData[$code])) {
                                $detailData[$code] -= $amount;
                            }
                        }
                        
                        DB::table('student_balance')
                            ->where('mshs', $mshs)
                            ->update([
                                'detail' => json_encode($detailData),
                                'updated_at' => now()
                            ]);
                    }
                }
            } else {
                // If no balance record exists, create one with negative balance (debt)
                DB::table('student_balance')->insert([
                    'mshs' => $mshs,
                    'balance' => -$debtAmount,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            // Clear cache for this student
            $this->clearStudentCache($mshs);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Error updating balance for debt for student {$mshs}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Format detail data for storage
     *
     * @param array|null $detail Detailed breakdown of balance by tuition code
     * @param array|null $advancePaymentInfo Information about advance payments
     * @return array Formatted detail data
     */
    private function formatDetailData($detail, $advancePaymentInfo)
    {
        $detailData = [];
        
        if ($detail && is_array($detail)) {
            // Convert the detail array to the format needed for storage
            $byCode = [];
            
            foreach ($detail as $item) {
                if (isset($item['code']) && isset($item['amount'])) {
                    $byCode[$item['code']] = $item['amount'];
                }
            }
            
            // If we have advance payment info, use the new format
            if ($advancePaymentInfo && isset($advancePaymentInfo['advance_months'])) {
                $detailData = [
                    'by_code' => $byCode,
                    'advance_months' => $advancePaymentInfo['advance_months'],
                    'monthly_fees' => $advancePaymentInfo['monthly_fees'] ?? 0,
                    'remaining_balance' => $advancePaymentInfo['remaining_balance'] ?? 0
                ];
            } else {
                // Otherwise use the old format (just the byCode array)
                $detailData = $byCode;
            }
        }
        
        return $detailData;
    }

    /**
     * Format detail for display
     *
     * @param array|null $detailedBalance Detailed balance by tuition code
     * @return array Formatted detail for display
     */
    private function formatDetailForDisplay($detailedBalance)
    {
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
        
        return $formattedDetail;
    }

    /**
     * Format advance payment info for display
     *
     * @param array|null $advancePaymentInfo Information about advance payments
     * @return array|null Formatted advance payment info
     */
    private function formatAdvancePaymentInfo($advancePaymentInfo)
    {
        if (!$advancePaymentInfo) {
            return null;
        }
        
        return [
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

    /**
     * Clear cache for a student
     *
     * @param string $mshs Student ID
     */
    private function clearStudentCache($mshs)
    {
        // Clear all cache keys related to this student
        Cache::forget('outstanding_debt_single_' . $mshs);
        
        // Clear month-specific caches
        for ($month = 1; $month <= 12; $month++) {
            Cache::forget('outstanding_debt_single_' . $mshs . '_' . $month);
        }
        
        // Clear any student balance cache
        Cache::forget('student_balance_' . $mshs);
    }
}
