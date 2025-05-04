<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use App\Models\Student;

class TransactionService
{
    /**
     * Get transactions for a specific student
     *
     * @param string $mshs Student ID
     * @param int|null $month Filter by month (optional)
     * @return array
     */
    public function getStudentTransactions($mshs, $month = null)
    {
        try {
            $query = Transaction::where('mshs', $mshs);
            
            if ($month !== null) {
                $query->where('payment_date', $month);
            }
            
            $transactions = $query->orderBy('created_at', 'desc')->get();
            
            return [
                'status' => 'success',
                'data' => $transactions
            ];
        } catch (\Exception $e) {
            Log::error("Error getting student transactions: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to get student transactions: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create a new transaction
     *
     * @param array $transactionData
     * @return array
     */
    public function createTransaction($transactionData)
    {
        try {
            DB::beginTransaction();
            
            // Create the transaction
            $transaction = new Transaction();
            $transaction->mshs = $transactionData['mshs'];
            $transaction->paid_code = $transactionData['paid_code'];
            $transaction->amount_paid = $transactionData['amount_paid'];
            $transaction->payment_date = $transactionData['payment_date'] ?? date('n'); // Current month if not specified
            $transaction->note = $transactionData['note'] ?? null;
            $transaction->save();
            
            // Update student balance if needed
            if (isset($transactionData['update_balance']) && $transactionData['update_balance']) {
                $this->updateStudentBalance($transactionData['mshs']);
            }
            
            DB::commit();
            
            return [
                'status' => 'success',
                'data' => $transaction
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error creating transaction: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to create transaction: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create multiple transactions in a batch
     *
     * @param array $transactions Array of transaction data
     * @param string $mshs Student ID
     * @param int|null $month Payment month
     * @return array
     */
    public function createBatchTransactions($transactions, $mshs, $month = null)
    {
        try {
            DB::beginTransaction();
            
            $createdTransactions = [];
            $currentMonth = $month ?? date('n');
            
            foreach ($transactions as $transaction) {
                if (!isset($transaction['code']) || !isset($transaction['amount'])) {
                    continue;
                }
                
                $newTransaction = new Transaction();
                $newTransaction->mshs = $mshs;
                $newTransaction->paid_code = $transaction['code'];
                $newTransaction->amount_paid = $transaction['amount'];
                $newTransaction->payment_date = $currentMonth;
                $newTransaction->note = $transaction['note'] ?? null;
                $newTransaction->save();
                
                $createdTransactions[] = $newTransaction;
            }
            
            // Update student balance
            $this->updateStudentBalance($mshs);
            
            DB::commit();
            
            return [
                'status' => 'success',
                'data' => $createdTransactions
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error creating batch transactions: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to create batch transactions: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update student balance after transactions
     *
     * @param string $mshs Student ID
     * @return bool
     */
    private function updateStudentBalance($mshs)
    {
        try {
            // Get all transactions for this student
            $transactions = Transaction::where('mshs', $mshs)->get();
            
            // Calculate total balance
            $totalBalance = 0;
            $detailedBalance = [];
            
            foreach ($transactions as $transaction) {
                $code = $transaction->paid_code;
                $amount = $transaction->amount_paid;
                
                // Add to total balance
                $totalBalance += $amount;
                
                // Add to detailed balance
                if (!isset($detailedBalance[$code])) {
                    $detailedBalance[$code] = 0;
                }
                $detailedBalance[$code] += $amount;
            }
            
            // Update or create student balance record
            DB::table('student_balance')->updateOrInsert(
                ['mshs' => $mshs],
                [
                    'balance' => $totalBalance,
                    'detail' => json_encode($detailedBalance),
                    'updated_at' => now()
                ]
            );
            
            return true;
        } catch (\Exception $e) {
            Log::error("Error updating student balance: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get transaction statistics
     *
     * @param array $filters
     * @return array
     */
    public function getTransactionStats($filters = [])
    {
        try {
            $query = Transaction::query();
            
            // Apply filters
            if (isset($filters['start_date'])) {
                $query->where('created_at', '>=', $filters['start_date']);
            }
            
            if (isset($filters['end_date'])) {
                $query->where('created_at', '<=', $filters['end_date']);
            }
            
            if (isset($filters['payment_date'])) {
                $query->where('payment_date', $filters['payment_date']);
            }
            
            // Get total amount
            $totalAmount = $query->sum('amount_paid');
            
            // Get count by fee code
            $countByCode = $query->select('paid_code', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount_paid) as total'))
                ->groupBy('paid_code')
                ->get();
            
            return [
                'status' => 'success',
                'data' => [
                    'total_amount' => $totalAmount,
                    'count_by_code' => $countByCode
                ]
            ];
        } catch (\Exception $e) {
            Log::error("Error getting transaction stats: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to get transaction stats: ' . $e->getMessage()
            ];
        }
    }
}