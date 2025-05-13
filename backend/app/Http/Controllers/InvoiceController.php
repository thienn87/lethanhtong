<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use App\Repositories\InvoiceRepository;
use App\Services\SearchService;
use Carbon\Carbon;
use App\Models\Student;
use App\Models\TuitionGroup;
use App\Services\OutstandingDebtService;

class InvoiceController extends Controller
{   
    private $outstandingDebtService;
    private function ensureInvoicesPartitionExists($yearMonth)
    {
        $partitionName = 'invoices_' . str_replace('-', '_', $yearMonth);
        $exists = DB::select("SELECT 1 FROM pg_class WHERE relname = ?", [$partitionName]);
        if (empty($exists)) {
            DB::statement("
                CREATE TABLE IF NOT EXISTS {$partitionName} PARTITION OF invoices
                FOR VALUES IN ('{$yearMonth}');
            ");
        }
    }

    public function __construct(OutstandingDebtService $outstandingDebtService)
    {
        $this->outstandingDebtService = $outstandingDebtService;
    }
    /**
     * Create a new invoice
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function create(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'mshs' => 'required|string',
                'invoice_id' => 'required|string',
                'transaction_id' => 'required|string',
                'invoice_details' => 'required|string',
                'transaction_data' => 'required|array',
                'transaction_data.*.code' => 'required|string',
                'transaction_data.*.amount' => 'required|numeric',
                'month' => 'nullable|integer|min:1|max:12',
                'created_at' => 'nullable|date',
                'status' => 'nullable|string|in:pending,completed,cancelled,refunded',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get validated data
            $data = $validator->validated();

            // Determine created_at and year_month (Asia/Bangkok timezone)
            if (!isset($data['created_at']) || !$data['created_at']) {
                $createdAt = Carbon::now('Asia/Bangkok');
            } else {
                $createdAt = Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok');
            }
            $data['created_at'] = $createdAt;
            $data['year_month'] = $createdAt->format('Y-m');
            
            // Set default status if not provided
            $data['status'] = $data['status'] ?? 'completed';

            // Create invoice using repository
            $invoiceRepository = new InvoiceRepository();
            $this->ensureInvoicesPartitionExists($data['year_month']);
            // Calculate total amount from transaction data
            $totalAmount = array_sum(array_column($data['transaction_data'], 'amount'));
            
            $invoice = $invoiceRepository->createInvoice([
                'invoice_id' => $data['invoice_id'],
                'mshs' => $data['mshs'],
                'transaction_id' => $data['transaction_id'],
                'invoice_details' => $data['invoice_details'],
                'created_at' => $data['created_at'],
                'year_month' => $data['year_month'],
                'status' => $data['status'],
                'total_amount' => $totalAmount,
                'created_by' => auth()->id() ?? null,
                'updated_by' => auth()->id() ?? null,
            ]);

            // Update student balance using the new method
            $studentBalanceService = app()->make('App\Services\StudentBalanceService');
            $balanceUpdated = $studentBalanceService->updateBalanceAfterInvoice(
                $data['mshs'],
                $data['transaction_data'],
                $data['month'] ?? null
            );

            if (!$balanceUpdated) {
                Log::warning("Invoice created but student balance update failed for MSHS: {$data['mshs']}");
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice created successfully',
                'data' => $invoice,
                'balance_updated' => $balanceUpdated
            ]);
        } catch (\Exception $e) {
            Log::error("Error creating invoice: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student balance (internal method)
     * 
     * @deprecated Use StudentBalanceService instead
     * @param string $mshs Student ID
     * @param array $transactionData Transaction data including amount and tuition items
     * @param int|null $month Month for which the transaction is being made (1-12)
     * @return bool Whether the operation was successful
     */
    private function updateStudentBalance($mshs, $transactionData, $month = null)
    {
        // Use StudentBalanceService instead
        $studentBalanceService = app()->make('App\Services\StudentBalanceService');
        return $studentBalanceService->create($mshs, $transactionData, $month);
    }

    public function delete(Request $request)
    {
        // Validate inputs
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|integer',
            'invoice_id' => 'nullable|string|max:255',
            'year' => 'nullable|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
            'allowDeleteComplete' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $id = $request->input('id');
        $invoiceId = $request->input('invoice_id');
        $year = $request->input('year');
        $month = $request->input('month');
        $allowDeleteComplete = $request->input('allowDeleteComplete', false);
        if ($allowDeleteComplete === null) {
            $allowDeleteComplete = false;
        }

        // Default year and month to current if null
        if ($year === null || $month === null) {
            $now = now('Asia/Bangkok');
            if ($year === null) {
                $year = $now->year;
            }
            if ($month === null) {
                $month = $now->month;
            }
        }

        $invoiceRepository = new InvoiceRepository();

        if ($id) {
            $data = $invoiceRepository->deleteInvoice($id);
        } elseif ($invoiceId) {
            $data = $invoiceRepository->deleteInvoiceByYearMonthAndInvoiceId($year, $month, $invoiceId, $allowDeleteComplete);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Either id or invoice_id must be provided'
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
    public function get(Request $request)
    {
        // Lấy số trang từ frontend, mặc định là 1 nếu không truyền
        $page = $request->input('page', 1);

        // Mỗi trang sẽ có 10 bản ghi
        $perPage = 10;

        // Tính toán số bản ghi cần bỏ qua (offset)
        $offset = ($page - 1) * $perPage;

        // Tạo mới InvoiceRepository và sử dụng phương thức getInvoices
        $invoiceRepository = new InvoiceRepository();
        $invoices = $invoiceRepository->getInvoices($offset, $perPage);

        // Gọi hàm xử lý để gắn thêm thông tin học sinh và giao dịch
        $invoicesWithDetails = collect($invoices)->map(function ($invoice) {
            // Gắn thông tin học sinh
            $student = SearchService::getStudentOfInvoice($invoice['transaction_id']);
            $invoice['student'] = $student;

            // Tách transaction_id (giả sử là chuỗi "1,2,3") thành mảng ID
            $transactionIds = array_map('trim', explode(',', $invoice['transaction_id']));

            // Lấy chi tiết các giao dịch
            $transactions = \App\Models\Transaction::whereIn('id', $transactionIds)->get();

            // Gắn vào hóa đơn
            $invoice['transactions'] = $transactions;

            return $invoice;
        });

        return response()->json([
            'status' => 'success',
            'data' => $invoicesWithDetails
        ]);
    }
    /**
     * Get a single invoice with transactions by ID
     *
     * @param int $id Invoice ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function getById($id)
    {
        try {
            // Get the invoice
            $invoice = DB::table('invoices')->where('id', $id)->first();
            
            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }
            
            // Convert to array for consistent handling
            $invoiceArray = (array)$invoice;
            
            // Get student information
            $student = SearchService::getStudentOfInvoice($invoiceArray['transaction_id']);
            $invoiceArray['student'] = $student;
            
            // Get transactions
            $transactionIds = array_map('trim', explode(',', $invoiceArray['transaction_id']));
            $transactions = \App\Models\Transaction::whereIn('id', $transactionIds)->get();
            
            // Calculate total amount
            $totalAmount = $transactions->sum('amount_paid');
            
            // Add transactions and total amount to the invoice
            $invoiceArray['transactions'] = $transactions;
            $invoiceArray['total_amount'] = $totalAmount;
            
            return response()->json([
                'status' => 'success',
                'data' => $invoiceArray
            ]);
        } catch (\Exception $e) {
            Log::error("Error getting invoice by ID: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get invoice: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get student details including properly formatted class
     * 
     * @param string $mshs Student ID
     * @return array|null Student details or null if not found
     */
    private function getStudentDetails($mshs)
    {
        $student = DB::table('students')
            ->where('mshs', $mshs)
            ->select('name', 'sur_name', 'grade', 'class')
            ->first();
            
        if (!$student) {
            return null;
        }
        
        return [
            'name' => $student->name,
            'sur_name' => $student->sur_name,
            'full_name' => $student->sur_name . ' ' . $student->name,
            'class_display' => $this->formatClassDisplay($student->grade, $student->class)
        ];
    }
    /**
     * Search for invoices based on various criteria
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            // Get search parameters
            $search = $request->input('search');
            $mshs = $request->input('mshs');
            $invoiceId = $request->input('so_hoa_don');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $page = $request->input('page', 1);
            $limit = $request->input('limit', 10);
            
            // Build query
            $query = DB::table('invoices')
                ->join('students', 'invoices.mshs', '=', 'students.mshs')
                // Use a different approach for the join to handle comma-separated values
                ->select(
                    'invoices.id',
                    'invoices.invoice_id',
                    'invoices.mshs',
                    'students.name',
                    'students.sur_name',
                    'students.grade',
                    'students.class',
                    'invoices.transaction_id',
                    'invoices.invoice_details',
                    'invoices.created_at'
                )
                ->where('status','=','completed');
            
            // Apply filters
            if ($startDate && $endDate) {
                $query->whereBetween('invoices.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }
            
            if ($mshs) {
                $query->where('invoices.mshs', $mshs);
            }
            
            if ($invoiceId) {
                $query->where('invoices.invoice_id', $invoiceId);
            }
            
            // Apply search if provided
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('invoices.invoice_id', 'like', "%{$search}%")
                    ->orWhere('invoices.mshs', 'like', "%{$search}%")
                    ->orWhere('students.name', 'like', "%{$search}%")
                    ->orWhere('students.sur_name', 'like', "%{$search}%")
                    ->orWhere(DB::raw("CONCAT(students.sur_name, ' ', students.name)"), 'like', "%{$search}%");
                });
            }
            
            // Get total count for pagination
            $totalCount = $query->count();
            $totalPages = ceil($totalCount / $limit);
            
            // Apply pagination
            $offset = ($page - 1) * $limit;
            $invoices = $query->orderBy('invoices.created_at', 'desc')
                ->offset($offset)
                ->limit($limit)
                ->get();
            
            // Format the data for response and fetch transaction details separately
            $formattedData = [];
            foreach ($invoices as $invoice) {
                // Format student name
                $fullName = $invoice->sur_name . ' ' . $invoice->name;
                
                // Format class using the enhanced helper method
                $classDisplay = $this->formatClassDisplay($invoice->grade, $invoice->class);
                
                // Get transaction details
                $transactionIds = array_filter(
                    array_map('trim', explode(',', $invoice->transaction_id)),
                    function($id) { return $id !== ''; }
                );
                if (!empty($transactionIds)) {
                    $transactions = DB::table('transactions')
                        ->whereIn('id', $transactionIds)
                        ->get();
                } else {
                    $transactions = collect(); // empty collection
                }

                $totalAmountPaid = $transactions->sum('amount_paid');

                // Format transaction details as an array of objects
                $transactionDetailsJson = [];
                foreach ($transactions as $transaction) {
                    $tuition = DB::table('tuition_groups')
                        ->where('code', $transaction->paid_code)
                        ->first();
                    $tuitionName = $tuition ? $tuition->name : 'Unknown';
                    $transactionDetailsJson[] = [
                        'tuition_name' => $tuitionName,
                        'note' => $transaction->note,
                        'paid_code' => $transaction->paid_code,
                        'amount_paid' => number_format($transaction->amount_paid) . ' VND',
                    ];
                }
                
                $formattedData[] = [
                    'id' => $invoice->id,
                    'invoice_id' => $invoice->invoice_id,
                    'mshs' => $invoice->mshs,
                    'student_name' => $fullName,
                    'class' => $classDisplay,
                    'amount_paid' => $totalAmountPaid,
                    'invoice_details' => $invoice->invoice_details,
                    'created_at' => $invoice->created_at,
                    'transaction_details' => $transactionDetailsJson,
                ];
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $formattedData,
                'total' => $totalCount,
                'per_page' => $limit,
                'current_page' => $page,
                'last_page' => $totalPages
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error searching invoices: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to search invoices: ' . $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Format class display properly
     * 
     * @param mixed $grade The grade value
     * @param mixed $class The class value
     * @return string The formatted class display
     */
    private function formatClassDisplay($grade, $class)
    {
        // Ensure both grade and class are treated as strings
        $gradeStr = is_null($grade) ? '' : (string)$grade;
        $classStr = is_null($class) ? '' : (string)$class;
        
        // If either is empty, return what we have
        if (empty($gradeStr)) {
            return $classStr;
        }
        if (empty($classStr)) {
            return $gradeStr;
        }
        
        // Return the concatenated value
        return $gradeStr . $classStr;
    }

    /**
     * Export invoices to Excel with filtering and search support
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function exportExcel(Request $request)
    {
        try {
            // Get filter parameters
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $mshs = $request->input('mshs');
            $search = $request->input('search');
            $invoiceId = $request->input('so_hoa_don');
            
            // Build query - avoid direct join with transactions table
            $query = DB::table('invoices')
                ->join('students', 'invoices.mshs', '=', 'students.mshs')
                ->select(
                    'invoices.id',
                    'invoices.invoice_id',
                    'invoices.mshs',
                    'students.name',
                    'students.sur_name',
                    'students.grade',
                    'students.class',
                    'invoices.transaction_id', // Get transaction_id directly
                    'invoices.invoice_details',
                    'invoices.created_at'
                )
                ->where('status','=','completed');
            
            // Apply filters
            if ($startDate && $endDate) {
                $query->whereBetween('invoices.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            }
            
            if ($mshs) {
                $query->where('invoices.mshs', $mshs);
            }
            
            if ($invoiceId) {
                $query->where('invoices.invoice_id', $invoiceId);
            }
            
            // Apply search if provided
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('invoices.invoice_id', 'like', "%{$search}%")
                    ->orWhere('invoices.mshs', 'like', "%{$search}%")
                    ->orWhere('students.name', 'like', "%{$search}%")
                    ->orWhere('students.sur_name', 'like', "%{$search}%")
                    ->orWhere(DB::raw("CONCAT(students.sur_name, ' ', students.name)"), 'like', "%{$search}%");
                });
            }
            
            // Get total count for pagination info
            $totalCount = $query->count();
            
            // Get all invoices for export (limit to 10000 for performance)
            $invoices = $query->orderBy('invoices.created_at', 'desc')
                ->limit(10000)
                ->get();
            
            // Process each invoice and get transaction details
            $invoiceData = [];
            foreach ($invoices as $invoice) {
                // Format student name
                $fullName = $invoice->sur_name . ' ' . $invoice->name;
                
                // Format class using the helper method
                $classDisplay = $this->formatClassDisplay($invoice->grade, $invoice->class);
                
                // Format date
                $createdAt = Carbon::parse($invoice->created_at)->format('d/m/Y');
                
                // Get all transaction details for this invoice
                $transactionDetails = [];
                $totalAmount = 0;
                
                if (!empty($invoice->transaction_id)) {
                    $transactionIds = explode(',', $invoice->transaction_id);
                    
                    foreach ($transactionIds as $transactionId) {
                        $transactionId = trim($transactionId);
                        if (empty($transactionId)) continue;
                        
                        $transaction = DB::table('transactions')
                            ->where('id', $transactionId)
                            ->first();
                        
                        if ($transaction) {
                            $transactionDetails[] = [
                                'id' => $transaction->id,
                                'paid_code' => $transaction->paid_code,
                                'amount_paid' => $transaction->amount_paid,
                            ];
                            
                            $totalAmount += $transaction->amount_paid;
                        }
                    }
                }
                
                // Format transaction details as a string
                $transactionDetailsText = '';
                foreach ($transactionDetails as $index => $detail) {
                    $transactionDetailsText .= ($index + 1) . '. ' . $detail['paid_code'] . ': ' . 
                        number_format($detail['amount_paid']) . ' VND';
                    
                    if ($index < count($transactionDetails) - 1) {
                        $transactionDetailsText .= "\n";
                    }
                }
                
                $invoiceData[] = [
                    'id' => $invoice->id,
                    'invoice_id' => $invoice->invoice_id,
                    'mshs' => $invoice->mshs,
                    'student_name' => $fullName,
                    'class' => $classDisplay,
                    'total_amount' => $totalAmount,
                    'transaction_details' => $transactionDetailsText,
                    'invoice_details' => $invoice->invoice_details,
                    'created_at' => $createdAt
                ];
            }
            
            // Create Excel file
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Set page orientation to landscape
            $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
            
            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(10); // STT
            $sheet->getColumnDimension('B')->setWidth(20); // Mã số giao dịch
            $sheet->getColumnDimension('C')->setWidth(15); // MSHS
            $sheet->getColumnDimension('D')->setWidth(30); // Tên học sinh
            $sheet->getColumnDimension('E')->setWidth(10); // Khối lớp
            $sheet->getColumnDimension('F')->setWidth(20); // Tổng số tiền
            $sheet->getColumnDimension('G')->setWidth(40); // Chi tiết giao dịch
            $sheet->getColumnDimension('H')->setWidth(30); // Chi tiết hóa đơn
            $sheet->getColumnDimension('I')->setWidth(15); // Ngày
            
            // Add title
            $sheet->setCellValue('A1', 'DANH SÁCH HÓA ĐƠN');
            $sheet->mergeCells('A1:I1');
            
            // Style the title
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Add filter information if applicable
            $filterRow = 2;
            if ($startDate && $endDate) {
                $sheet->setCellValue('A' . $filterRow, 'Thời gian: ' . Carbon::parse($startDate)->format('d/m/Y') . ' - ' . Carbon::parse($endDate)->format('d/m/Y'));
                $sheet->mergeCells('A' . $filterRow . ':I' . $filterRow);
                $filterRow++;
            }
            
            if ($mshs) {
                $sheet->setCellValue('A' . $filterRow, 'MSHS: ' . $mshs);
                $sheet->mergeCells('A' . $filterRow . ':I' . $filterRow);
                $filterRow++;
            }
            
            if ($search) {
                $sheet->setCellValue('A' . $filterRow, 'Tìm kiếm: ' . $search);
                $sheet->mergeCells('A' . $filterRow . ':I' . $filterRow);
                $filterRow++;
            }
            
            // Add export date
            $sheet->setCellValue('A' . $filterRow, 'Ngày xuất: ' . Carbon::now()->format('d/m/Y H:i:s'));
            $sheet->mergeCells('A' . $filterRow . ':I' . $filterRow);
            $filterRow++;
            
            // Add empty row
            $filterRow++;
            
            // Add headers
            $headerRow = $filterRow;
            $sheet->setCellValue('A' . $headerRow, 'STT');
            $sheet->setCellValue('B' . $headerRow, 'Mã số giao dịch');
            $sheet->setCellValue('C' . $headerRow, 'MSHS');
            $sheet->setCellValue('D' . $headerRow, 'Tên học sinh');
            $sheet->setCellValue('E' . $headerRow, 'Khối lớp');
            $sheet->setCellValue('F' . $headerRow, 'Tổng số tiền');
            $sheet->setCellValue('G' . $headerRow, 'Chi tiết giao dịch');
            $sheet->setCellValue('H' . $headerRow, 'Chi tiết hóa đơn');
            $sheet->setCellValue('I' . $headerRow, 'Ngày');
            
            // Style the headers
            $headerStyle = [
                'font' => [
                    'bold' => true,
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'E0E0E0',
                    ],
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ];
            
            $sheet->getStyle('A' . $headerRow . ':I' . $headerRow)->applyFromArray($headerStyle);
            
            // Add data
            $row = $headerRow + 1;
            foreach ($invoiceData as $index => $data) {
                $sheet->setCellValue('A' . $row, $index + 1);
                $sheet->setCellValue('B' . $row, $data['invoice_id']);
                $sheet->setCellValue('C' . $row, $data['mshs']);
                $sheet->setCellValue('D' . $row, $data['student_name']);
                
                // Fix: Prefix class value with apostrophe to force text format
                $sheet->setCellValueExplicit(
                    'E' . $row, 
                    $data['class'], 
                    \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
                );
                
                $sheet->setCellValue('F' . $row, number_format($data['total_amount']) . ' VND');
                $sheet->setCellValue('G' . $row, $data['transaction_details']);
                $sheet->setCellValue('H' . $row, $data['invoice_details']);
                $sheet->setCellValue('I' . $row, $data['created_at']);
                
                // Enable text wrapping for transaction details
                $sheet->getStyle('G' . $row)->getAlignment()->setWrapText(true);
                
                $row++;
            }
            
            // Style the data
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ];
            
            $sheet->getStyle('A' . ($headerRow + 1) . ':I' . ($row - 1))->applyFromArray($dataStyle);
            
            // Center some columns
            $sheet->getStyle('A' . ($headerRow + 1) . ':A' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('B' . ($headerRow + 1) . ':B' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('C' . ($headerRow + 1) . ':C' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . ($headerRow + 1) . ':E' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('I' . ($headerRow + 1) . ':I' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Right-align amount column
            $sheet->getStyle('F' . ($headerRow + 1) . ':F' . ($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            
            // Vertical alignment for all cells
            $sheet->getStyle('A' . ($headerRow + 1) . ':I' . ($row - 1))->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
            
            // Auto-height rows to fit content
            for ($i = $headerRow + 1; $i < $row; $i++) {
                $sheet->getRowDimension($i)->setRowHeight(-1);
            }
            // Add this code to create a total row:
            // Calculate total amount
            $totalAmount = array_sum(array_column($invoiceData, 'total_amount'));

            // Add a total row with adjusted column positions
            $sheet->mergeCells('A' . $row . ':C' . $row); // Merge A, B, and C for empty space
            $sheet->mergeCells('D' . $row . ':E' . $row); // Merge D and E for "TỔNG CỘNG:"
            $sheet->setCellValue('D' . $row, 'TỔNG CỘNG:');
            $sheet->mergeCells('F' . $row . ':G' . $row); // Merge F and G for the amount
            $sheet->setCellValue('F' . $row, number_format($totalAmount) . ' VND');
            $sheet->mergeCells('H' . $row . ':I' . $row); // Merge H and I for empty space

            // Style the total row
            $totalRowStyle = [
                'font' => [
                    'bold' => true,
                    'size' => 14,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'FFEB9C', // Light yellow background
                    ],
                ],
                'borders' => [
                    'outline' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
            ];

            // Apply the style to the entire row from A to I
            $sheet->getStyle('A' . $row . ':I' . $row)->applyFromArray($totalRowStyle);
            $sheet->getStyle('D' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle('F' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            // Set the amount text color to red
            $sheet->getStyle('F' . $row)->getFont()->getColor()->setRGB('FF0000'); // Red color

            // Increment row for signature section
            $row += 3; // Add more space before signatures
            
            $sheet->setCellValue('B' . $row, 'Người lập biểu');
            $sheet->setCellValue('E' . $row, 'Thủ quỷ');
            $sheet->setCellValue('H' . $row, 'Kế toán trưởng');
            
            // Style signatures
            $sheet->getStyle('B' . $row)->getFont()->setBold(true);
            $sheet->getStyle('E' . $row)->getFont()->setBold(true);
            $sheet->getStyle('H' . $row)->getFont()->setBold(true);
            
            $sheet->getStyle('B' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('H' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Add space for signatures
            $row += 5;
            
            $sheet->setCellValue('B' . $row, '____________________');
            $sheet->setCellValue('E' . $row, '____________________');
            $sheet->setCellValue('H' . $row, '____________________');
            
            $sheet->getStyle('B' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('H' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Save file
            $fileName = 'hoa-don-' . Carbon::now()->format('d-m-Y-H-i-s') . '.xlsx';
            $filePath = public_path('exports/' . $fileName);
            
            // Ensure the directory exists
            if (!file_exists(public_path('exports'))) {
                mkdir(public_path('exports'), 0755, true);
            }
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);
            
            // Return file path
            return response()->json([
                'status' => 'success',
                'message' => 'Excel file generated successfully',
                'file_path' => url('exports/' . $fileName),
                'file_name' => $fileName,
                'total_records' => $totalCount,
                'exported_records' => count($invoiceData)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error exporting invoices to Excel: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export invoices: ' . $e->getMessage(),
            ], 500);
        }
    }
}
