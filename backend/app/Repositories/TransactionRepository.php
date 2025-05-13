<?php
namespace App\Repositories;

use App\Models\Student;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TransactionRepository
{   
    private function ensureTransactionPartitionExists($yearMonth)
    {
        $partitionName = 'transactions_' . str_replace('-', '_', $yearMonth);
        $exists = DB::select("SELECT 1 FROM pg_class WHERE relname = ?", [$partitionName]);
        if (empty($exists)) {
            DB::statement("
                CREATE TABLE IF NOT EXISTS {$partitionName} PARTITION OF transactions
                FOR VALUES IN ('{$yearMonth}');
            ");
        }
    }
    /**
     * Create a new transaction
     *
     * @param array $data
     * @return Transaction|false
     */
    public function createTransaction($data)
    {
        try {
            DB::beginTransaction();

            $student = Student::where('mshs', $data['mshs'])->first();

            if (!$student) {
                DB::rollBack();
                Log::error("Student not found with MSHS: {$data['mshs']}");
                return false;
            }

            // Set created_at and year_month (Asia/Bangkok timezone)
            $createdAt = isset($data['created_at']) && $data['created_at']
                ? Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok')
                : Carbon::now('Asia/Bangkok');
            $data['created_at'] = $createdAt;
            $data['updated_at'] = $createdAt;
            $data['year_month'] = $createdAt->format('Y-m');
            $this->ensureTransactionPartitionExists($data['year_month']);
            $transaction = new Transaction();
            $transaction->student_name = $student->sur_name . " " . $student->name;
            $transaction->mshs = $student->mshs;
            $transaction->paid_code = $data["paid_code"];
            $transaction->amount_paid = $data["amount_paid"];
            $transaction->payment_date = $data['payment_date'] ?? $createdAt->format('n');
            $transaction->note = $data['note'] ?? '';
            $transaction->invoice_no = $data['invoice_no'] ?? '--';
            $transaction->year_month = $data['year_month'];
            $transaction->created_at = $data['created_at'];
            $transaction->updated_at = $data['updated_at'];
            $transaction->save();

            DB::commit();

            return $transaction;
        } catch (\Exception $e) {
            DB::rollBack();
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
            DB::beginTransaction();

            $student = Student::where('mshs', $data['mshs'])->first();

            if (!$student) {
                DB::rollBack();
                Log::error("Student not found with MSHS: {$data['mshs']}");
                return 'khong tim thay hoc sinh';
            }

            // Set created_at and year_month (Asia/Bangkok timezone)
            $createdAt = isset($data['created_at']) && $data['created_at']
                ? Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok')
                : Carbon::now('Asia/Bangkok');
            $data['created_at'] = $createdAt;
            $data['updated_at'] = $createdAt;
            $data['year_month'] = $createdAt->format('Y-m');

            $transaction = Transaction::where('id', $data["id"])
                              ->where('mshs', $data["mshs"])
                              ->first();

            if ($transaction) {
                $transaction->student_name = $student->sur_name . " " . $student->name;
                $transaction->paid_code = $data["paid_code"];
                $transaction->amount_paid = $data["amount_paid"];
                $transaction->payment_date = $data['payment_date'] ?? $createdAt->format('n');
                $transaction->note = $data['note'] ?? '';
                $transaction->year_month = $data['year_month'];
                $transaction->updated_at = $data['updated_at'];
                $transaction->invoice_no = $data['invoice_no'] ?? $transaction->invoice_no ?? '--';
                $transaction->save();

                DB::commit();
                return $transaction;
            }

            // If transaction doesn't exist, create a new one
            $newTransaction = new Transaction();
            $newTransaction->student_name = $student->sur_name . " " . $student->name;
            $newTransaction->mshs = $student->mshs;
            $newTransaction->paid_code = $data["paid_code"];
            $newTransaction->amount_paid = $data["amount_paid"];
            $newTransaction->payment_date = $data['payment_date'] ?? $createdAt->format('n');
            $newTransaction->note = $data['note'] ?? '';
            $newTransaction->year_month = $data['year_month'];
            $this->ensureTransactionPartitionExists($data['year_month']);
            $newTransaction->created_at = $data['created_at'];
            $newTransaction->updated_at = $data['updated_at'];
            $newTransaction->invoice_no = $data['invoice_no'] ?? '--';
            $newTransaction->save();

            DB::commit();
            return $newTransaction;
        } catch (\Exception $e) {
            DB::rollBack();
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
            DB::beginTransaction();

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
            $oldRevenue = $currentRevenue;
            $newRevenue = $currentRevenue - $amount;

            $student->$revenueField = $newRevenue;
            $student->save();

            // Set created_at and year_month (Asia/Bangkok timezone)
            $createdAt = Carbon::now('Asia/Bangkok');
            $yearMonth = $createdAt->format('Y-m');

            // Create a new transaction with negative amount
            $transaction = new Transaction();
            $transaction->student_name = $student->sur_name . " " . $student->name;
            $transaction->mshs = $student->mshs;
            $transaction->paid_code = $data["paid_code"] ?? 'REVERT';
            $transaction->amount_paid = -1 * abs($amount);
            $transaction->payment_date = $createdAt->format('n');
            $transaction->note = "Hoàn học phí tháng $month, số dư thay đổi từ $oldRevenue sang $newRevenue";
            $transaction->invoice_no = $data['invoice_no'] ?? '--';
            $transaction->year_month = $yearMonth;
            $transaction->created_at = $createdAt;
            $transaction->updated_at = $createdAt;
            $transaction->save();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
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
            $maxId = DB::table('transactions')->max('id');

            if ($maxId) {
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
