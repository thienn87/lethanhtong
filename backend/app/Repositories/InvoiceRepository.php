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
        // Tìm hóa đơn dựa trên transaction_id
        $invoice = Invoice::where('id', $id)->first();

        if ($invoice) {
            $invoice->delete(); // Xoá hóa đơn
            return true; // Trả về true nếu xóa thành công
        }

        return false; // Trả về false nếu không tìm thấy hóa đơn
    }
    /**
     * Reset the invoice sequence to the maximum ID + 1
     *
     * @return void
     */
    private function resetInvoiceSequence()
    {
        try {
            // Get the maximum ID from the invoices table
            $maxId = DB::table('invoices')->max('id');
            
            if ($maxId) {
                // Reset the sequence to start from the max ID + 1
                DB::statement("SELECT setval('invoices_id_seq', $maxId, true)");
                Log::info("Invoice sequence reset to " . ($maxId + 1));
            }
        } catch (\Exception $e) {
            Log::warning("Failed to reset invoice sequence: " . $e->getMessage());
            // Continue anyway, as the insert might still work
        }
    }

    /**
     * Create a new invoice
     *
     * @param array $data
     * @return \App\Models\Invoice
     */
    public function createInvoice($data)
    {
        try {
            // Reset the sequence to avoid primary key conflicts
            $this->resetInvoiceSequence();
            
            // Create the invoice normally
            $invoice = new Invoice();
            $invoice->invoice_id = $data['invoice_id'];
            $invoice->mshs = $data['mshs'];
            $invoice->transaction_id = $data['transaction_id'];
            $invoice->invoice_details = $data['invoice_details'];
            $invoice->save();
            
            return $invoice;
        } catch (\Exception $e) {
            Log::error("Error creating invoice: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a new invoice with sequence reset to avoid primary key conflicts
     * @deprecated Use createInvoice() instead
     * @param array $data
     * @return \App\Models\Invoice
     */
    public function createInvoiceWithSequenceReset($data)
    {
        return $this->createInvoice($data);
    }

    // Cập nhật một hóa đơn nếu tồn tại
    public function updateInvoice($data)
    {
        $invoice = Invoice::where('id', $data["id"])->first();
        
        if ($invoice) {
            // Cập nhật thông tin hóa đơn nếu tìm thấy
            $invoice->update([
                'invoice_details' => $data['invoice_details'], // Cập nhật trực tiếp thông tin chi tiết
            ]);
            $invoice->update([
                'transaction_id' => $data['transaction_id'], // Cập nhật trực tiếp thông tin chi tiết
            ]);
            $invoice->update([
                'invoice_id' => $data['invoice_id'], // Cập nhật trực tiếp thông tin chi tiết
            ]);
            return $invoice; // Trả về hóa đơn đã cập nhật
        }
    }

    public function filterInvoices($startDate, $endDate, $offset = 0, $perPage = 10)
    {
        $start = Carbon::parse($startDate)->startOfDay(); 
        $end = Carbon::parse($endDate)->endOfDay();   
    
        return Invoice::whereBetween('created_at', [$start, $end])
        ->orderBy('created_at', 'desc')
        ->skip($offset)
        ->take($perPage)
        ->get();    }

    public function getInvoices($offset, $perPage)
    {
        return Invoice::orderBy('created_at', 'desc')
        ->skip($offset)
        ->take($perPage)
        ->get();    }
}
