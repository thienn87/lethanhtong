<?php
namespace App\Repositories;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceRepository
{
    public function deleteInvoice($id)
    {
        $invoice = Invoice::where('id', $id)->first();

        if ($invoice) {
            $invoice->delete();
            return true;
        }

        return false;
    }

    /**
     * Delete invoices by year, month, and invoice ID.
     * By default, only deletes invoices where status != "complete".
     * If $allowDeleteComplete is true, will also delete invoices with status "completed".
     *
     * @param int $year The year of the invoice
     * @param int $month The month of the invoice
     * @param string $invoiceId The invoice ID
     * @param bool $allowDeletecompleted If true, allows deletion of invoices with status "completed"
     * @return bool True if any invoices were deleted, false otherwise
     */
    public function deleteInvoiceByYearMonthAndInvoiceId($year, $month, $invoiceId, $allowDeleteComplete = false)
    {
        $yearMonth = sprintf('%04d-%02d', $year, $month);
        $query = Invoice::where('year_month', $yearMonth)
            ->where('invoice_id', $invoiceId);

        // By default, do not delete invoices with status "completed"
        if (!$allowDeleteComplete) {
            // If status is not "completed" or status is null/missing, allow deletion
            $query->where(function ($q) {
                $q->where('status', '!=', 'completed')
                  ->orWhereNull('status');
            });
        }
        // If $allowDeleteComplete is true, delete regardless of status

        $invoices = $query->get();

        if ($invoices->isNotEmpty()) {
            foreach ($invoices as $invoice) {
                $invoice->delete();
                $deleteTransactions = $this->deleteTransactionsByInvoice($invoice->transaction_id, $yearMonth);
            }
            return true;
        }
        
        return false;
    }
    /**
     * Delete all transactions that belong to the given invoice by its ID and year_month.
     * The invoice's transaction_id field is a comma-separated string of transaction IDs.
     *
     * @param int $invoiceId The primary key of the invoice
     * @param string $yearMonth The year and month in 'YYYY-MM' format
     * @return int Number of deleted transactions
     */
    public function deleteTransactionsByInvoice($invoiceId, $yearMonth)
    {
        $invoice = Invoice::where('invoice_id', $invoiceId)
                          ->where('year_month', $yearMonth);
        if (!$invoice || empty($invoice->transaction_id)) {
            return 0;
        }

        // Parse transaction_id field (format: "1,2,3")
        $transactionIds = array_filter(array_map('trim', explode(',', $invoice->transaction_id)));

        if (empty($transactionIds)) {
            return 0;
        }

        // Delete transactions with these IDs and matching year_month
        $deleted = DB::table('transactions')
            ->whereIn('id', $transactionIds)
            ->where('year_month', $yearMonth)
            ->delete();

        return $deleted;
    }
    private function resetInvoiceSequence()
    {
        try {
            $maxId = DB::table('invoices')->max('id');
            if ($maxId) {
                DB::statement("SELECT setval('invoices_id_seq', $maxId, true)");
                Log::info("Invoice sequence reset to " . ($maxId + 1));
            }
        } catch (\Exception $e) {
            Log::warning("Failed to reset invoice sequence: " . $e->getMessage());
        }
    }

    public function createInvoice($data)
    {
        try {
            $this->resetInvoiceSequence();

            $createdAt = isset($data['created_at']) && $data['created_at']
                ? Carbon::parse($data['created_at'])->setTimezone('Asia/Bangkok')
                : Carbon::now('Asia/Bangkok');
            $data['created_at'] = $createdAt;
            $data['updated_at'] = $createdAt;
            $data['year_month'] = $createdAt->format('Y-m');

            $invoice = new Invoice();
            $invoice->invoice_id = $data['invoice_id'];
            $invoice->mshs = $data['mshs'];
            $invoice->transaction_id = $data['transaction_id'];
            $invoice->invoice_details = $data['invoice_details'];
            $invoice->created_at = $data['created_at'];
            $invoice->updated_at = $data['updated_at'];
            $invoice->year_month = $data['year_month'];
            if (isset($data['status'])) {
                $invoice->status = $data['status'];
            }
            $invoice->save();

            return $invoice;
        } catch (\Exception $e) {
            Log::error("Error creating invoice: " . $e->getMessage());
            throw $e;
        }
    }

    public function createInvoiceWithSequenceReset($data)
    {
        return $this->createInvoice($data);
    }

    public function updateInvoice($data)
    {
        $invoice = Invoice::where('id', $data["id"])->first();

        if ($invoice) {
            $updatedAt = isset($data['updated_at']) && $data['updated_at']
                ? Carbon::parse($data['updated_at'])->setTimezone('Asia/Bangkok')
                : Carbon::now('Asia/Bangkok');
            $data['updated_at'] = $updatedAt;
            $data['year_month'] = $updatedAt->format('Y-m');

            $invoice->invoice_details = $data['invoice_details'];
            $invoice->transaction_id = $data['transaction_id'];
            $invoice->invoice_id = $data['invoice_id'];
            $invoice->updated_at = $data['updated_at'];
            $invoice->year_month = $data['year_month'];
            if (isset($data['status'])) {
                $invoice->status = $data['status'];
            }
            $invoice->save();

            return $invoice;
        }

        return null;
    }

    public function filterInvoices($startDate, $endDate, $offset = 0, $perPage = 10)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        return Invoice::whereBetween('created_at', [$start, $end])
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get();
    }

    public function getInvoices($offset, $perPage)
    {
        return Invoice::orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get();
    }
}
