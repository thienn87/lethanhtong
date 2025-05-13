<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Repositories\TransactionRepository;
use App\Repositories\InvoiceRepository;
use App\Models\Transaction;
use App\Models\Invoice;
use App\Services\TuitionMonthlyService;
use Illuminate\Support\Facades\Log;
use Exception;
use Carbon\Carbon;
class PaymentController extends Controller
{
    protected $transactionRepository;
    protected $invoiceRepository;
    protected $tuitionMonthlyService;

    
    public function __construct(
        TransactionRepository $transactionRepository,
        InvoiceRepository $invoiceRepository,
        TuitionMonthlyService $tuitionMonthlyService
    ) {
        $this->transactionRepository = $transactionRepository;
        $this->invoiceRepository = $invoiceRepository;
        $this->tuitionMonthlyService = $tuitionMonthlyService;
    }

    
    public function processPayment(Request $request)
    {
        // Validate request data
        $validator = Validator::make($request->all(), [
            'invoice_id' => 'required|string',
            'invoice_details' => 'required|string',
            'mshs' => 'required',
            'month' => 'required',
            'transaction_data' => 'required|array',
            'transaction_data.*.code' => 'required|string',
            'transaction_data.*.amount' => 'required|numeric',
            'transaction_data.*.note' => 'nullable|string',
            'pending_invoice_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Start transaction
            DB::beginTransaction();

            // Extract request data
            $invoiceId = $request->input('invoice_id');
            $invoiceDetails = $request->input('invoice_details');
            $mshs = $request->input('mshs');
            $month = $request->input('month');
            $status = $request->input('status', 'completed');
            $transactionData = $request->input('transaction_data');
            $pendingInvoiceId = $request->input('pending_invoice_id');
            
            $transactionIds = [];
            $totalAmount = 0;

            // Process each transaction
            foreach ($transactionData as $transaction) {
                // Only process transactions with positive amounts
                if ($transaction['amount'] > 0) {
                    $transactionResult = $this->transactionRepository->createTransaction([
                        'mshs' => $mshs,
                        'note' => $transaction['note'] ?? '',
                        'paid_code' => $transaction['code'],
                        'amount_paid' => $transaction['amount'],
                        'payment_date' => $month,
                    ]);

                    if ($transactionResult && isset($transactionResult->id)) {
                        $transactionIds[] = $transactionResult->id;
                        $totalAmount += $transaction['amount'];
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Failed to create transaction for code: ' . $transaction['code']
                        ], 500);
                    }
                }
            }

            // Check if any transactions were created
            if (empty($transactionIds)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'No transactions were created'
                ], 500);
            }

            // Set timestamps
            $createdAt = Carbon::now('Asia/Bangkok');
            $yearMonth = $createdAt->format('Y-m');

            // Handle invoice creation or update
            $invoice = null;
            if ($pendingInvoiceId) {
                $invoice = Invoice::where('invoice_id', $pendingInvoiceId)->first();
                
                if ($invoice) {
                    $invoice->invoice_id = $invoiceId;
                    $invoice->transaction_id = implode(', ', $transactionIds);
                    $invoice->invoice_details = $invoiceDetails;
                    $invoice->updated_at = $createdAt;
                    $invoice->status = $status;
                    $invoice->save();
                }
            }

            // Create new invoice if needed
            if (!$invoice) {
                $this->ensureInvoicesPartitionExists($yearMonth);
                
                $invoice = new Invoice();
                $invoice->invoice_id = $invoiceId;
                $invoice->mshs = $mshs;
                $invoice->transaction_id = implode(', ', $transactionIds);
                $invoice->invoice_details = $invoiceDetails;
                $invoice->created_at = $createdAt;
                $invoice->updated_at = $createdAt;
                $invoice->year_month = $yearMonth;
                $invoice->status = $status;
                $invoice->save();
            }

            // Update tuition monthly data
            $this->tuitionMonthlyService->updateTuitionMonthlyAfterInvoice(
                $mshs,
                $transactionData,
                $yearMonth
            );

            // Commit transaction
            DB::commit();

            // Return minimal success response
            return response()->json([
                'status' => 'success',
                'message' => 'Payment processed successfully',
                'data' => [
                    'invoice_id' => $invoice->invoice_id,
                    'created_at' => $invoice->created_at,
                ]
            ]);

        } catch (Exception $e) {
            // Rollback on error
            DB::rollBack();
            
            Log::error("Payment processing error: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while processing payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    
    private function ensureInvoicesPartitionExists($yearMonth)
    {
        try {
            $partitionName = 'invoices_' . str_replace('-', '_', $yearMonth);
            $exists = DB::select("SELECT 1 FROM pg_class WHERE relname = ?", [$partitionName]);
            if (empty($exists)) {
                DB::statement("
                    CREATE TABLE IF NOT EXISTS {$partitionName} PARTITION OF invoices
                    FOR VALUES IN ('{$yearMonth}');
                ");
                Log::info("Created partition table: {$partitionName}");
            }
            return true;
        } catch (\Exception $e) {
            Log::error("Error creating partition: " . $e->getMessage());
            return false;
        }
    }
    
    
    public function getInvoiceWithTransactions($id)
    {
        try {
            $invoice = Invoice::where('id', $id)->first();
            
            if (!$invoice) {
                return null;
            }
            
            $transactionIds = array_map('trim', explode(',', $invoice->transaction_id));
            
            $transactions = Transaction::whereIn('id', $transactionIds)->get();
            
            $totalAmount = $transactions->sum('amount_paid');
            
            $result = [
                'id' => $invoice->id,
                'invoice_id' => $invoice->invoice_id,
                'mshs' => $invoice->mshs,
                'transaction_id' => $invoice->transaction_id,
                'invoice_details' => $invoice->invoice_details,
                'created_at' => $invoice->created_at,
                'updated_at' => $invoice->updated_at,
                'year_month' => $invoice->year_month,
                'status' => $invoice->status ?? 'completed',
                'total_amount' => $totalAmount,
                'transactions' => $transactions
            ];
            
            return $result;
        } catch (\Exception $e) {
            Log::error("Error fetching invoice with transactions: " . $e->getMessage());
            return null;
        }
    }
    
    
    public function getPaymentReceipt($invoiceId)
    {
        try {
            $invoice = $this->getInvoiceWithTransactions($invoiceId);
            
            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $invoice
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while fetching payment receipt',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}