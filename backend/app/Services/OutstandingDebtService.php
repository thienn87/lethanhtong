<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Transaction;
use App\Models\TuitionGroup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OutstandingDebtService
{
    protected $cacheTime = 60; // Cache for 60 minutes
    protected $tuitionGroupsCache = [];
    protected $studentCache = [];
    protected $transactionsCache = [];

    public function index()
    {
        // Use cache for this expensive operation
        return Cache::remember('outstanding_debt_index', $this->cacheTime, function () {
            $students = Student::select(
                'grade', 
                'revenue_01', 'revenue_02', 'revenue_03', 'revenue_04', 'revenue_05', 'revenue_06',
                'revenue_07', 'revenue_08', 'revenue_09', 'revenue_10', 'revenue_11', 'revenue_12'
            )->get();
            
            $year = date('Y');
            $result = [];
            
            // Preload all tuition groups to avoid repeated queries
            $allTuitionGroups = $this->getAllTuitionGroups();
            
            for ($month = 1; $month <= 12; $month++) {
                $grades = $students
                    ->groupBy('grade')
                    ->map(function ($group) use ($month, $allTuitionGroups) {
                        $revenueField = "revenue_" . str_pad($month, 2, "0", STR_PAD_LEFT);
                        $revenue = $group->sum($revenueField);
                        
                        return [
                            'grade' => $group->first()->grade,
                            'revenue' => $revenue,
                            'outstandingDebt' => $this->getDebtByMonth($month, $group->first()->grade, 0, $allTuitionGroups)['debt']
                        ];
                    })
                    ->values()
                    ->toArray();

                $result[] = [
                    'month' => $month,
                    'year' => $year,
                    'grades' => $grades,
                    'totalRevenue' => '',
                    'totalOutstandingDebt' => ''
                ];
            }
            
            return $result;
        });
    }

    /**
     * Get outstanding debt details for a specific student
     *
     * @param string $mshs Student ID
     * @param int|null $selectedMonth Month to query (1-12), defaults to current month
     * @return array|bool Student debt details or false if student not found
     */
    public function single($mshs, $selectedMonth = null)
    {
        // Start timing the execution
        $startTime = microtime(true);
        
        // Get student data with a single query
        $student = $this->getStudent($mshs);
        
        if (!$student) {
            return false;
        }
        
        // Use provided month or default to current month
        $currentMonth = $selectedMonth ? intval($selectedMonth) : intval(date('n'));
        $previousMonth = $currentMonth - 1 > 0 ? $currentMonth - 1 : 12;
        
        // stay_in return boolean
        $stay_in = $student->stay_in;
        
        // Get all tuition groups in one query
        $allTuitionGroups = $this->getAllTuitionGroups();
        
        // Get all transactions for this student in one query
        $allTransactions = $this->getStudentTransactions($mshs);
        
        // Process debt information in parallel using array operations instead of multiple queries
        $debt = $this->getDebtByMonth($currentMonth, $student->grade, $student->discount, $allTuitionGroups, $stay_in);
        $debt_previous = $this->getDebtByMonth($previousMonth, $student->grade, $student->discount, $allTuitionGroups, $stay_in);
        
        // Filter transactions by month
        $paid_debt_previous_month = $this->filterTransactionsByMonth($allTransactions, $previousMonth);
        $paid_current_month = $this->filterTransactionsByMonth($allTransactions, $currentMonth);
        
        // Calculate balances efficiently
        $tuition_details = $this->calculateBalance($debt, $debt_previous, $paid_debt_previous_month);
        
        // Calculate current month balances
        $phai_thu_thang_nay = $debt['debt_with_discount'];
        $da_thu_thang_nay = $this->sumTransactionAmounts($paid_current_month);
        
        // Get student balance from database
        $studentBalance = null;
        $tong_du_cuoi = 0;
        try {
            $studentBalance = DB::table('student_balance')
                ->where('mshs', $student->mshs)
                ->first();
            
            if ($studentBalance && isset($studentBalance->balance)) {
                $tong_du_cuoi = $studentBalance->balance;
            } else {
                // If no balance record exists, calculate it
                $tong_du_cuoi = $this->calculateTotalBalance($student, $currentMonth, $allTuitionGroups, $allTransactions);
            }
        } catch (\Exception $e) {
            Log::warning("Error fetching student_balance for MSHS {$student->mshs}: " . $e->getMessage());
            // Calculate total balance if there was an error
            $tong_du_cuoi = $this->calculateTotalBalance($student, $currentMonth, $allTuitionGroups, $allTransactions);
        }
        
        // Calculate du_cuoi_thang_nay using the formula:
        // du_cuoi_thang_nay = student_balance.balance + da_thu_thang_nay - phai_thu_thang_nay
        $du_cuoi_thang_nay = $tong_du_cuoi + $da_thu_thang_nay - $phai_thu_thang_nay;
        
        // Calculate previous month balances
        $phai_thu_thang_truoc = $debt_previous['debt_with_discount'];
        $da_thu_thang_truoc = $this->sumTransactionAmounts($paid_debt_previous_month);
        
        // Calculate detailed balances
        $detailed_du_cuoi_thang_nay = $this->calculateDetailedBalance($debt['tuition_apply'], $paid_current_month);
        $detailed_du_cuoi_thang_truoc = $this->calculateDetailedBalance($debt_previous['tuition_apply'], $paid_debt_previous_month);
        
        // Get detailed balance from student_balance table
        $detailedBalance = null;
        $advancePaymentInfo = null;
        try {
            if ($studentBalance && isset($studentBalance->detail)) {
                $detailedBalanceData = json_decode($studentBalance->detail, true);
                
                // Check if the detailed balance has the new format with advance months
                if (isset($detailedBalanceData['by_code'])) {
                    $detailedBalance = $detailedBalanceData['by_code'];
                    $advancePaymentInfo = [
                        'advance_months' => $detailedBalanceData['advance_months'] ?? 0,
                        'monthly_fees' => $detailedBalanceData['monthly_fees'] ?? 0,
                        'remaining_balance' => $detailedBalanceData['remaining_balance'] ?? 0
                    ];
                } else {
                    $detailedBalance = $detailedBalanceData;
                    
                    // Calculate advance payment info if not available
                    if ($tong_du_cuoi > 0 && $phai_thu_thang_nay > 0) {
                        $advanceMonths = floor($tong_du_cuoi / $phai_thu_thang_nay);
                        $remainingBalance = $tong_du_cuoi - ($advanceMonths * $phai_thu_thang_nay);
                        
                        $advancePaymentInfo = [
                            'advance_months' => $advanceMonths,
                            'monthly_fees' => $phai_thu_thang_nay,
                            'remaining_balance' => $remainingBalance
                        ];
                    }
                }
            } else if (!$detailedBalance && $tong_du_cuoi > 0) {
                // If we don't have detailed balance but we have a total balance, calculate the breakdown
                $detailedBalanceData = $this->calculateDetailedBalanceFromTotal($student, $currentMonth, $allTuitionGroups, $allTransactions, $tong_du_cuoi);
                
                if (isset($detailedBalanceData['by_code'])) {
                    $detailedBalance = $detailedBalanceData['by_code'];
                    $advancePaymentInfo = [
                        'advance_months' => $detailedBalanceData['advance_months'] ?? 0,
                        'monthly_fees' => $detailedBalanceData['monthly_fees'] ?? 0,
                        'remaining_balance' => $detailedBalanceData['remaining_balance'] ?? 0
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning("Error processing detailed balance for MSHS {$student->mshs}: " . $e->getMessage());
        }
        
        // Prepare result
        $result = [
            'student' => $student,
            'discount_rate' => $student->discount,
            'chi_tiet_phai_thu_thang_nay' => $debt,
            'chi_tiet_phai_thu_thang_truoc' => $debt_previous,
            'chi_tiet_da_thu_thang_truoc' => $paid_debt_previous_month,
            'so_du_dau_ki' => $tuition_details,
            'da_thu' => $paid_current_month,
            'du_cuoi_thang_nay' => [
                'total' => $du_cuoi_thang_nay,
                'details' => $detailed_du_cuoi_thang_nay
            ],
            'du_cuoi_thang_truoc' => [
                'details' => $detailed_du_cuoi_thang_truoc
            ],
            'tong_du_cuoi' => $tong_du_cuoi,
            'tong_du_cuoi_chi_tiet' => $detailedBalance,
            'advance_payment_info' => $advancePaymentInfo,
            'selected_month' => $currentMonth
        ];
        
        // Log execution time
        $executionTime = microtime(true) - $startTime;
        Log::info("OutstandingDebtService::single for MSHS {$mshs} month {$currentMonth} completed in {$executionTime} seconds");
        
        return $result;
    }

    // Optimized helper methods
    
    private function getStudent($mshs)
    {
        if (!isset($this->studentCache[$mshs])) {
            // Use a more efficient query with select to limit data transfer
            $this->studentCache[$mshs] = Student::select('id', 'mshs', 'name', 'sur_name', 'grade', 'class', 'discount','stay_in')
                ->where('mshs', $mshs)
                ->first();
        }
        return $this->studentCache[$mshs];
    }
    
    private function getAllTuitionGroups()
    {
        if (empty($this->tuitionGroupsCache)) {
            $this->tuitionGroupsCache = Cache::remember('all_tuition_groups', $this->cacheTime, function () {
                return TuitionGroup::all();
            });
        }
        return $this->tuitionGroupsCache;
    }
    
    private function getStudentTransactions($mshs)
    {
        if (!isset($this->transactionsCache[$mshs])) {
            // Use a more efficient query with select to limit data transfer
            $this->transactionsCache[$mshs] = Transaction::select('id', 'mshs', 'paid_code', 'amount_paid', 'payment_date')
                ->where('mshs', (string) $mshs)
                ->get();
        }
        return $this->transactionsCache[$mshs];
    }
    
    private function filterTransactionsByMonth($transactions, $month)
    {
        return $transactions->filter(function ($transaction) use ($month) {
            return $transaction->payment_date == $month;
        })->values();
    }
    
    private function sumTransactionAmounts($transactions)
    {
        return $transactions->sum('amount_paid');
    }
    
    /**
     * Calculate detailed balance for tuition items and payments
     *
     * @param array $tuition_items Array of tuition items
     * @param \Illuminate\Support\Collection $payments Collection of payments
     * @return array Detailed balance information
     */
    private function calculateDetailedBalance($tuition_items, $payments)
    {
        $detailed_balance = [];
        $paymentsByCode = [];
        
        // Group payments by paid_code for faster lookup
        foreach ($payments as $payment) {
            if (!isset($paymentsByCode[$payment->paid_code])) {
                $paymentsByCode[$payment->paid_code] = 0;
            }
            $paymentsByCode[$payment->paid_code] += $payment->amount_paid;
        }
        
        // Check if tuition_items is an array of objects or array of arrays
        foreach ($tuition_items as $tuition_item) {
            // Determine if we're dealing with an object or an array
            if (is_object($tuition_item)) {
                $tuition_code = $tuition_item->code;
                $tuition_name = $tuition_item->name;
                $tuition_amount = $tuition_item->default_amount;
            } else if (is_array($tuition_item)) {
                $tuition_code = $tuition_item['code'];
                $tuition_name = $tuition_item['name'];
                $tuition_amount = $tuition_item['default_amount'];
            } else {
                // Skip if neither object nor array
                Log::warning("Unexpected tuition_item type in calculateDetailedBalance: " . gettype($tuition_item));
                continue;
            }
            
            $paid_amount = isset($paymentsByCode[$tuition_code]) ? $paymentsByCode[$tuition_code] : 0;
            
            $detailed_balance[] = [
                'tuition_code' => $tuition_code,
                'name' => $tuition_name,
                'total_amount' => $tuition_amount,
                'paid_amount' => $paid_amount,
            ];
        }
        
        return $detailed_balance;
    }
    /**
     * Calculate detailed balance breakdown from total balance
     * This is used when we have a total balance but need to separate it by tuition group
     *
     * @param \App\Models\Student $student Student object
     * @param int $currentMonth Current month (1-12)
     * @param \Illuminate\Database\Eloquent\Collection $allTuitionGroups Collection of tuition groups
     * @param \Illuminate\Database\Eloquent\Collection $allTransactions Collection of student transactions
     * @param float $totalBalance Total balance to distribute
     * @return array Detailed balance by tuition group
     */
    private function calculateDetailedBalanceFromTotal($student, $currentMonth, $allTuitionGroups, $allTransactions, $totalBalance)
    {
        // First, get all tuition groups that apply to this student's grade
        $applicableTuitionGroups = [];
        $totalMonthlyFees = 0;
        
        // Get the student's monthly tuition structure
        foreach ($allTuitionGroups as $group) {
            if ($group->grade === $student->grade) {
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
                    
                    $applicableTuitionGroups[$group->code] = [
                        'code' => $group->code,
                        'name' => $group->name,
                        'amount' => $amountWithDiscount,
                        'group' => $group->group
                    ];
                    
                    $totalMonthlyFees += $amountWithDiscount;
                }
            }
        }
        
        // If there are no applicable tuition groups or no monthly fees, return empty
        if (empty($applicableTuitionGroups) || $totalMonthlyFees <= 0) {
            return [];
        }
        
        // Calculate how many months of advance payment we have
        $advanceMonths = floor($totalBalance / $totalMonthlyFees);
        $remainingBalance = $totalBalance - ($advanceMonths * $totalMonthlyFees);
        
        Log::info("MSHS {$student->mshs} has {$advanceMonths} months of advance payment with {$remainingBalance} remaining");
        
        // Distribute the balance proportionally among tuition groups
        $detailedBalance = [];
        
        // First, allocate full months of advance payment
        foreach ($applicableTuitionGroups as $code => $group) {
            $detailedBalance[$code] = $group['amount'] * $advanceMonths;
        }
        
        // Then distribute the remaining balance proportionally
        if ($remainingBalance > 0) {
            foreach ($applicableTuitionGroups as $code => $group) {
                $proportion = $group['amount'] / $totalMonthlyFees;
                $detailedBalance[$code] += $remainingBalance * $proportion;
            }
        }
        
        // Add month information to the detailed balance
        $detailedBalanceWithMonths = [
            'by_code' => $detailedBalance,
            'advance_months' => $advanceMonths,
            'monthly_fees' => $totalMonthlyFees,
            'remaining_balance' => $remainingBalance
        ];
        
        return $detailedBalanceWithMonths;
    }
    /**
     * Calculate total balance for a student with detailed breakdown by tuition group
     *
     * @param \App\Models\Student $student Student object
     * @param int $currentMonth Current month (1-12)
     * @param \Illuminate\Database\Eloquent\Collection $allTuitionGroups Collection of tuition groups
     * @param \Illuminate\Database\Eloquent\Collection $allTransactions Collection of student transactions
     * @return float Total balance
     */
    private function calculateTotalBalance($student, $currentMonth, $allTuitionGroups, $allTransactions)
    {
        // First try to get the balance from the student_balance table
        try {
            $studentBalance = DB::table('student_balance')
                ->where('mshs', $student->mshs)
                ->first();
            
            // If we have a balance record with details, return that value
            if ($studentBalance && isset($studentBalance->balance)) {
                Log::info("Using student_balance.balance for MSHS {$student->mshs}: {$studentBalance->balance}");
                
                // If we don't have detailed breakdown yet, calculate it now
                if (!isset($studentBalance->detail) || empty($studentBalance->detail)) {
                    $detailedBalance = $this->calculateDetailedBalanceFromTotal($student, $currentMonth, $allTuitionGroups, $allTransactions, $studentBalance->balance);
                    
                    // Update the student_balance table with the detailed breakdown
                    DB::table('student_balance')->where('mshs', $student->mshs)->update([
                        'detail' => json_encode($detailedBalance),
                        'updated_at' => now()
                    ]);
                    
                    Log::info("Updated student_balance detail for MSHS {$student->mshs}");
                }
                
                return $studentBalance->balance;
            }
        } catch (\Exception $e) {
            Log::warning("Error fetching student_balance for MSHS {$student->mshs}: " . $e->getMessage());
            // Continue with manual calculation
        }
        
        // If no balance record exists, calculate it using the original method
        Log::info("No student_balance record found for MSHS {$student->mshs}, calculating manually");
        
        $tong_du_cuoi = 0;
        $startMonth = ($currentMonth >= 6 && $currentMonth <= 12) ? 6 : 1;
        
        $stay_in = $student->stay_in;
        
        // Group transactions by month for faster lookup
        $transactionsByMonth = [];
        foreach ($allTransactions as $transaction) {
            $month = $transaction->payment_date;
            if (!isset($transactionsByMonth[$month])) {
                $transactionsByMonth[$month] = [];
            }
            $transactionsByMonth[$month][] = $transaction;
        }
        
        // Initialize detailed balance tracking
        $detailedBalance = [];
        
        for ($month = $startMonth; $month <= $currentMonth; $month++) {
            $debt = $this->getDebtByMonth($month, $student->grade, $student->discount, $allTuitionGroups, $stay_in);
            
            $monthTransactions = isset($transactionsByMonth[$month]) ? collect($transactionsByMonth[$month]) : collect([]);
            
            // Group transactions by paid_code for this month
            $transactionsByCode = [];
            foreach ($monthTransactions as $transaction) {
                if (!isset($transactionsByCode[$transaction->paid_code])) {
                    $transactionsByCode[$transaction->paid_code] = 0;
                }
                $transactionsByCode[$transaction->paid_code] += $transaction->amount_paid;
            }
            
            // Calculate balance for each tuition group
            foreach ($debt['tuition_apply'] as $tuitionItem) {
                $code = $tuitionItem->code;
                $amount = $tuitionItem->default_amount;
                
                // Apply discount if applicable
                if (strpos($tuitionItem->grade, "HP") > -1) {
                    $amountWithDiscount = $amount - ($amount * $student->discount / 100);
                } else {
                    $amountWithDiscount = $amount;
                }
                
                // Get paid amount for this code
                $paidAmount = isset($transactionsByCode[$code]) ? $transactionsByCode[$code] : 0;
                
                // Calculate balance for this code
                $codeBalance = $paidAmount - $amountWithDiscount;
                
                // Add to detailed balance
                if (!isset($detailedBalance[$code])) {
                    $detailedBalance[$code] = 0;
                }
                $detailedBalance[$code] += $codeBalance;
                
                // Add to total balance
                $tong_du_cuoi += $codeBalance;
            }
        }
        
        // After calculating, try to store this value in the student_balance table for future use
        try {
            DB::table('student_balance')->updateOrInsert(
                ['mshs' => $student->mshs],
                [
                    'balance' => $tong_du_cuoi,
                    'detail' => json_encode($detailedBalance),
                    'updated_at' => now()
                ]
            );
            Log::info("Updated student_balance for MSHS {$student->mshs} with balance: {$tong_du_cuoi} and detailed breakdown");
        } catch (\Exception $e) {
            Log::error("Failed to update student_balance for MSHS {$student->mshs}: " . $e->getMessage());
        }
        
        return $tong_du_cuoi;
    }
    
    private function calculateBalance($debt, $debt_previous, $paid_debt_previous_month)
    {
        $result = [];
        $paymentsByCode = [];
        
        // Group payments by paid_code for faster lookup
        foreach ($paid_debt_previous_month as $payment) {
            if (!isset($paymentsByCode[$payment->paid_code])) {
                $paymentsByCode[$payment->paid_code] = 0;
            }
            $paymentsByCode[$payment->paid_code] += $payment->amount_paid;
        }
        
        foreach ($debt_previous['tuition_apply'] as $debt_item) {
            $code = $debt_item['code'];
            $paid_amount = isset($paymentsByCode[$code]) ? $paymentsByCode[$code] : 0;
            
            $result[] = [
                'debt_code' => $code,
                'name' => $debt_item['name'],
                'total_amount_previous_month' => $debt_item['default_amount'],
                'paid_amount_previous_month' => $paid_amount,
                'remaining_amount_previous_month' => $debt_item['default_amount'] - $paid_amount,
                'remaining_amount_current_month' => 0
            ];
        }
        
        // Create a lookup map for current month items
        $currentMonthItems = [];
        foreach ($debt['tuition_apply'] as $item) {
            $currentMonthItems[$item['code']] = $item;
        }
        
        // Update remaining amounts for current month
        foreach ($result as &$item) {
            if (isset($currentMonthItems[$item['debt_code']])) {
                $item['remaining_amount_current_month'] = $currentMonthItems[$item['debt_code']]['default_amount'] + $item['remaining_amount_previous_month'];
            }
        }
        
        return $result;
    }

    /**
     * Get debt by month with proper handling of stay_in parameter
     *
     * @param int $month Month number (1-12)
     * @param string $grade Student grade
     * @param float $discount Discount percentage
     * @param \Illuminate\Database\Eloquent\Collection|null $tuitionGroups Collection of tuition groups
     * @param bool|null $stay_in Whether student stays in dormitory
     * @return array Debt information
     */
    public function getDebtByMonth($month, $grade, $discount = 0, $tuitionGroups = null, $stay_in = null)
    {
        // Use cached tuition groups if not provided
        if ($tuitionGroups === null) {
            $tuitionGroups = $this->getAllTuitionGroups();
        }
        
        $debt = 0;
        $debt_with_discount = 0;
        $tuition_apply = [];
        
        // Create a lookup map for month_apply values
        $monthApplyMap = [];
        foreach ($tuitionGroups as $group) {
            $monthApply = $group->month_apply;
            if (!$monthApply) continue;
            
            $monthApplyArray = strpos($monthApply, ',') > 0 ? explode(",", $monthApply) : [$monthApply];
            $monthApplyMap[$group->id] = $monthApplyArray;
        }
        
        foreach ($tuitionGroups as $group) {
            // Skip NT groups if stay_in is false
            if ($stay_in === false && $group->group === "NT") {
                continue;
            }
            
            $classCode = $group->grade;
            $amount = $group->default_amount;
            
            // Check if this tuition applies to this grade and month using the lookup map
            if ($classCode === $grade && isset($monthApplyMap[$group->id]) && in_array($month, $monthApplyMap[$group->id])) {
                $tuition_apply[] = $group;
                $debt += $amount;
                
                // Apply discount only to HP (học phí) items
                if (strpos($classCode, "HP") > -1) {
                    $debt_with_discount += $amount - ($amount * $discount / 100);
                } else {
                    $debt_with_discount += $amount;
                }
            }
        }
        
        return [
            'month' => $month,
            'debt' => $debt,
            'debt_with_discount' => $debt_with_discount,
            'tuition_apply' => $tuition_apply,
        ];
    }
}