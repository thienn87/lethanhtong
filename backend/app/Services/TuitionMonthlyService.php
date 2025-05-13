<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Models\TuitionMonthlyFeeListing;

class TuitionMonthlyService
{
    /**
     * Update tuition_monthly_fee_listings table after invoice creation
     * This method updates the JSON fields dathu, phaithu, and duno correctly
     *
     * @param string $mshs Student ID
     * @param array $transactionData Array of transaction data
     * @param string $yearMonth Payment month in YYYY-MM format
     * @return bool Success status
     */
    public function updateTuitionMonthlyAfterInvoice($mshs, $transactionData, $yearMonth)
    {
        try {
            if (empty($mshs) || empty($transactionData) || empty($yearMonth)) {
                Log::warning('Missing required parameters for tuition monthly update');
                return false;
            }

            // Find the tuition monthly fee listing record for this student and month
            $tuitionListing = TuitionMonthlyFeeListing::where('mshs', $mshs)
                ->where('year_month', $yearMonth)
                ->first();

            if (!$tuitionListing) {
                Log::error("No tuition monthly fee listing found for MSHS: {$mshs}, month: {$yearMonth}");
                return false;
            }

            // Begin transaction
            DB::beginTransaction();

            // Get current dathu, phaithu, and duno values
            $dathu = is_string($tuitionListing->dathu) 
                ? json_decode($tuitionListing->dathu, true) 
                : $tuitionListing->dathu;
                
            $phaithu = is_string($tuitionListing->phaithu) 
                ? json_decode($tuitionListing->phaithu, true) 
                : $tuitionListing->phaithu;
                
            $duno = is_string($tuitionListing->duno) 
                ? json_decode($tuitionListing->duno, true) 
                : $tuitionListing->duno;

            // Initialize dathu if it doesn't exist
            if (!$dathu || !is_array($dathu)) {
                $dathu = [
                    'details' => [],
                    'totalPaidAmount' => 0
                ];
            }

            // Initialize details if it doesn't exist
            if (!isset($dathu['details']) || !is_array($dathu['details'])) {
                $dathu['details'] = [];
            }

            // Initialize phaithu if it doesn't exist
            if (!$phaithu || !is_array($phaithu)) {
                $phaithu = [
                    'details' => [],
                    'total' => 0
                ];
            }

            // Initialize phaithu details if it doesn't exist
            if (!isset($phaithu['details']) || !is_array($phaithu['details'])) {
                $phaithu['details'] = [];
            }

            // Initialize duno if it doesn't exist
            if (!$duno || !is_array($duno)) {
                $duno = [
                    'details' => [],
                    'total' => 0
                ];
            }

            // Initialize duno details if it doesn't exist
            if (!isset($duno['details']) || !is_array($duno['details'])) {
                $duno['details'] = [];
            }

            // Process each transaction
            foreach ($transactionData as $transaction) {
                $code = $transaction['code'];
                $amount = $transaction['amount'];
                
                // 1. Update dathu (đã thu) - INCREASE by the amount paid
                // Update dathu totalPaidAmount
                $dathu['total'] = ($dathu['total'] ?? 0) + $amount;
                
                // Update dathu details - accumulate by code
                if (!isset($dathu['details'][$code])) {
                    $dathu['details'][$code] = 0;
                }
                $dathu['details'][$code] += $amount;
                
                // 2. Update phaithu (phải thu) - DECREASE by the amount paid
                // Only decrease if phaithu exists for this code and has a positive value
                if (isset($phaithu['details'][$code]) && $phaithu['details'][$code] > 0) {
                    // Decrease phaithu, but don't go below zero
                    $phaithu['details'][$code] = max(0, $phaithu['details'][$code] - $amount);
                }
                
                // 3. Update duno (dư nợ) - Recalculate based on phaithu and dathu
                // duno = dathu - phaithu (for each code)
                if (!isset($duno['details'][$code])) {
                    $duno['details'][$code] = 0;
                }
                 // duno = dathu - phaithu
                //Ignore if $code = "OT"
               if($code != 'OT')
                    $duno['details'][$code] += $amount;
            }
            
            // Recalculate phaithu total
            $phaithu['total'] = array_sum(array_values($phaithu['details']));
            // Recalculate duno total
            $duno['total'] = array_sum(array_values($duno['details']));
            
            // Update the record
            $tuitionListing->dathu = $dathu;
            $tuitionListing->phaithu = $phaithu;
            $tuitionListing->duno = $duno;
            
            // Add invoice_ids if they don't exist
            $invoice_ids = is_string($tuitionListing->invoice_ids) 
                ? json_decode($tuitionListing->invoice_ids, true) 
                : ($tuitionListing->invoice_ids ?? []);
                
            // Get the latest invoice ID from the database
            $latestInvoice = DB::table('invoices')
                ->where('mshs', $mshs)
                ->where('year_month', $yearMonth)
                ->orderBy('id', 'desc')
                ->first();
                
            if ($latestInvoice && !in_array($latestInvoice->id, $invoice_ids)) {
                $invoice_ids[] = $latestInvoice->id;
                $tuitionListing->invoice_ids = $invoice_ids;
            }
            
            $tuitionListing->save();
            
            // Commit transaction
            DB::commit();
            return true;
        } catch (Exception $e) {
            // Rollback transaction on error
            DB::rollBack();
            Log::error("Error updating tuition monthly fee listings: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
}