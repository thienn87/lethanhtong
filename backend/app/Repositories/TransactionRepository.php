<?php

namespace App\Repositories;

use App\Models\Student;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionRepository
{
    /**
     * Create a new transaction
     *
     * @param array $data
     * @return Transaction|false
     */
    public function createTransaction($data)
    {
        try {
            // Start a database transaction
            DB::beginTransaction();
            
            $student = Student::where('mshs', $data['mshs'])->first();

            if (!$student) {
                DB::rollBack();
                Log::error("Student not found with MSHS: {$data['mshs']}");
                return false;
            }

            $transaction = new Transaction();
            $transaction->student_name = $student->sur_name . " " . $student->name;
            $transaction->mshs = $student->mshs;
            $transaction->paid_code = $data["paid_code"];
            $transaction->amount_paid = $data["amount_paid"]; // Số tiền mới nộp vào
            $transaction->payment_date = $data['payment_date'] ?? now()->format('n');
            $transaction->note = $data['note'] ?? '';
            $transaction->invoice_no = $data['invoice_no'] ?? '--';
            
            $transaction->save();
            
            // Commit the transaction
            DB::commit();
            
            return $transaction;
        } catch (\Exception $e) {
            // Rollback the transaction in case of error
            DB::rollBack();
            
            // Log the error
            Log::error('Failed to create transaction: ' . $e->getMessage());
            
            return false;
        }
    }
    /**
     * Update an existing transaction or create a new one
     *
     * @param array $data
     * @return Transaction|string|bool
     */
    public function updateTransaction($data)
    {
        try {
            // Start a database transaction
            DB::beginTransaction();
            
            $student = Student::where('mshs', $data['mshs'])->first();

            if (!$student) {
                DB::rollBack();
                Log::error("Student not found with MSHS: {$data['mshs']}");
                return 'khong tim thay hoc sinh';
            }

            $transaction = Transaction::where('id', $data["id"])
                              ->where('mshs', $data["mshs"])
                              ->first();
            
            if ($transaction) {
                $transaction->student_name = $student->sur_name . " " . $student->name;
                $transaction->paid_code = $data["paid_code"];
                $transaction->amount_paid = $data["amount_paid"]; // Cập nhật số tiền
                $transaction->payment_date = $data['payment_date'] ?? now()->format('n');
                $transaction->note = $data['note'] ?? '';
                
                $transaction->save();
                
                DB::commit();
                return $transaction;
            }
            
            // If transaction doesn't exist, create a new one
            $newTransaction = new Transaction();
            // Don't set ID manually, let the database handle it
            $newTransaction->student_name = $student->sur_name . " " . $student->name;
            $newTransaction->mshs = $student->mshs;
            $newTransaction->paid_code = $data["paid_code"];
            $newTransaction->amount_paid = $data["amount_paid"];
            $newTransaction->payment_date = $data['payment_date'] ?? now()->format('n');
            $newTransaction->note = $data['note'] ?? '';
            
            $newTransaction->save();
            
            DB::commit();
            return $newTransaction;
        } catch (\Exception $e) {
            // Rollback the transaction in case of error
            DB::rollBack();
            
            // Log the error
            Log::error('Failed to update transaction: ' . $e->getMessage());
            
            return false;
        }
    }

    /**
     * Revert a transaction
     *
     * @param array $data
     * @return bool
     */
    public function revertTransaction($data)
    {
        try {
            // Start a database transaction
            DB::beginTransaction();
            
            /** 
             * Need mshs to search student
             * Need amount to revert 
             * Need time (month) to revert
             **/
            $amount = $data['amount'];
            $month = $data['month'];
            
            $student = Student::where('mshs', $data['mshs'])->first();
            
            if (!$student) {
                DB::rollBack();
                Log::error("Student not found with MSHS: {$data['mshs']}");
                return false;
            }
            
            $revenueField = "revenue_$month";
            $currentRevenue = $student->$revenueField;
            $oldRevenue = $currentRevenue; // Save for logging
            $newRevenue = $currentRevenue - $amount;
            
            $student->$revenueField = $newRevenue;
            $student->save();
            
            // Create a new transaction with negative amount
            $transaction = new Transaction();
            $transaction->student_name = $student->sur_name . " " . $student->name;
            $transaction->mshs = $student->mshs;
            $transaction->paid_code = $data["paid_code"] ?? 'REVERT';
            $transaction->amount_paid = -1 * abs($amount); // Ensure negative amount
            $transaction->payment_date = now()->format('n');
            $transaction->note = "Hoàn học phí tháng $month, số dư thay đổi từ $oldRevenue sang $newRevenue";
            $transaction->invoice_no = $data['invoice_no'] ?? '--';
            
            $transaction->save();
            
            // Commit the transaction
            DB::commit();
            
            return true;
        } catch (\Exception $e) {
            // Rollback the transaction in case of error
            DB::rollBack();
            
            // Log the error
            Log::error('Failed to revert transaction: ' . $e->getMessage());
            
            return false;
        }
    }
    
    /**
     * Fix the PostgreSQL sequence for the transactions table
     * This should be run as a maintenance task if ID conflicts occur
     *
     * @return bool
     */
    public function fixSequence()
    {
        try {
            // Get the maximum ID from the transactions table
            $maxId = DB::table('transactions')->max('id');
            
            if ($maxId) {
                // Set the sequence to start from the next available ID
                DB::statement("SELECT setval('transactions_id_seq', {$maxId}, true)");
                Log::info("Fixed transactions sequence to start from " . ($maxId + 1));
            }
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to fix transaction sequence: ' . $e->getMessage());
            return false;
        }
    }
}
