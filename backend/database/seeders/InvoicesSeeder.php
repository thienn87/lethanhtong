<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;

class InvoicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Invoice::truncate();
        $firstline = true;
        $input_file = fopen(base_path("database/THANG2.csv"), "r");
        while (($data = fgetcsv($input_file, null, ";")) !== FALSE) {
            if (!$firstline) {
                $invoices = $data;
                $invoice_no = $invoices[0];
                $invoice_month = date('m', strtotime($invoices[1])); //Get month from create date
                $invoice_number = sprintf('%05d', $invoices[2]); //Format number to 5 digits
                $formatted_invoice_no = $invoice_number.'/'.$invoice_month; //Format invoice number to xxxxx/m
                $items = DB::table('transactions')->where('invoice_no', 'like', $invoice_no)->get();
                $transaction_ids="";
                foreach($items as $item){
                    if($transaction_ids=="")
                        $transaction_ids .=  $item->id;
                    else
                        $transaction_ids .= ",".$item->id;
                }
                Invoice::create([
                    'transaction_id'              => $transaction_ids,
                    'invoice_details'          => $invoices[7],
                    'invoice_id' => $formatted_invoice_no,
                    'created_at' =>  $invoices[1],
                    'mshs' =>  $invoices[3],
                ]);  
            }
            $firstline = false;
        }
    }
}
