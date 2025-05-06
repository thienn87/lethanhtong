<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Invoice;
use App\Services\StudentBalanceService;
use Carbon\Carbon;
use Exception;

class InvoiceImportController extends Controller
{
    protected $studentBalanceService;

    public function __construct(StudentBalanceService $studentBalanceService)
    {
        $this->studentBalanceService = $studentBalanceService;
    }

    /**
     * Import invoices from Excel rows
     */
    public function import(Request $request)
    {
        $rows = $request->input('rows', []);
        if (!is_array($rows) || empty($rows)) {
            return response()->json(['error' => 'Không có dữ liệu để nhập'], 400);
        }

        $successCount = 0;
        $errors = [];

        // Process each row in its own transaction
        foreach ($rows as $rowIdx => $row) {
            $rowNum = $rowIdx + 2; // Excel row number (accounting for header row)
            
            // Validate required fields
            $validator = Validator::make($row, [
                'ngayct' => 'required',
                'sct' => 'required',
                'mahs' => 'required',
                'khoi' => 'required',
            ]);
            
            if ($validator->fails()) {
                $errors[] = "Dòng $rowNum: " . implode(', ', $validator->errors()->all());
                continue;
            }
            
            $mahs = trim($row['mahs'] ?? '');
            $ngayct = $this->parseDate($row['ngayct']);
            $sct = $row['sct'] ?? '';
            
            if (!$ngayct) {
                $errors[] = "Dòng $rowNum: Ngày chứng từ không hợp lệ";
                continue;
            }

            // Start a new transaction for each row
            DB::beginTransaction();
            
            try {
                // Get student information
                $student = Student::where('mshs', $mahs)->first();
                if (!$student) {
                    $errors[] = "Dòng $rowNum: Không tìm thấy học sinh với mã $mahs";
                    DB::rollBack();
                    continue;
                }
                
                $fullname = trim($student->sur_name . ' ' . $student->name);
                $khoi = $row['khoi'] ?? '';
                $lop = $row['lop'] ?? '';
                $ghichu = $row['ghichu'] ?? '';
                
                // Fee codes to process
                $codes = ['HP', 'BT', 'NT', 'LPNT'];
                $createdTransactionIds = [];
                $month = intval(date('n', strtotime($ngayct)));
                
                // Generate invoice_no
                $invoice_no = $sct . '/' . $month;
                
                // Track transaction data for balance update
                $transactionData = [];
                $totalTransactionAmount = 0;
                
                // Process each fee type
                foreach ($codes as $code) {
                    $amount = isset($row[$code]) ? floatval($row[$code]) : 0;
                    if ($amount > 0) {
                        $paid_code = $code === 'LPNT' ? 'LPNT' : $code . $khoi;
                        
                        try {
                            // Create the transaction
                            $transaction = Transaction::create([
                                'student_name' => $fullname,
                                'mshs' => $mahs,
                                'paid_code' => $paid_code,
                                'amount_paid' => $amount,
                                'payment_date' => $month,
                                'note' => $ghichu,
                                'invoice_no' => $invoice_no,
                                'created_at' => $ngayct,
                                'updated_at' => $ngayct,
                            ]);
                            
                            $createdTransactionIds[] = $transaction->id;
                            
                            // Add to transaction data for balance update
                            $transactionData[] = [
                                'code' => $paid_code,
                                'amount' => $amount
                            ];
                            
                            $totalTransactionAmount += $amount;
                            
                        } catch (Exception $e) {
                            throw new Exception("Không thể tạo giao dịch cho loại phí $code: " . $e->getMessage());
                        }
                    }
                }

                // Create invoice if any transactions were created
                if (count($createdTransactionIds) > 0) {
                    try {
                        Invoice::create([
                            'invoice_id' => $invoice_no,
                            'mshs' => $mahs,
                            'transaction_id' => implode(',', $createdTransactionIds),
                            'invoice_details' => $ghichu,
                            'created_at' => $ngayct,
                            'updated_at' => $ngayct,
                        ]);
                        
                        // Update student balance using the updateBalanceAfterInvoice method
                        $this->studentBalanceService->updateBalanceAfterInvoice($mahs, $transactionData, $month);
                        
                        $successCount++;
                        DB::commit();
                    } catch (Exception $e) {
                        throw new Exception("Không thể tạo hóa đơn: " . $e->getMessage());
                    }
                } else {
                    $errors[] = "Dòng $rowNum: Không có khoản phí nào được nhập cho học sinh $mahs";
                    DB::rollBack();
                }
            } catch (Exception $e) {
                DB::rollBack();
                $errorMessage = "Dòng $rowNum: Lỗi khi nhập hóa đơn cho học sinh $mahs: " . $e->getMessage();
                $errors[] = $errorMessage;
                Log::error($errorMessage);
            }
        }
        
        return response()->json([
            'successCount' => $successCount,
            'errors' => $errors,
        ]);
    }
    
    /**
     * Parse date from various formats
     */
    private function parseDate($dateString)
    {
        if (empty($dateString)) {
            return null;
        }
        
        // Handle Excel date serial numbers
        if (is_numeric($dateString)) {
            // Excel date serial number (days since 1900-01-01, with some quirks)
            $excelBaseDate = Carbon::createFromDate(1899, 12, 30);
            return $excelBaseDate->addDays((int)$dateString);
        }
        
        try {
            return Carbon::parse($dateString);
        } catch (Exception $e) {
            return null;
        }
    }
}