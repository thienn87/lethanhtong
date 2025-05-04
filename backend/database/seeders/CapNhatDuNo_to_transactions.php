<?php

namespace Database\Seeders;
use App\Models\Transaction;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use \DateTime;

class CapNhatDuNo_to_transactions extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $firstline = true;
        $input_file = fopen(base_path("database/DuNo03.csv"), "r");
        while (($data = fgetcsv($input_file, null, ";")) !== FALSE) {
            if (!$firstline) {
                $transaction = $data;
                $mshs = $transaction[0];
                if (substr($mshs, 0, 1) === '0') {
                    $mshs = substr($mshs, 1);
                }

                $grade = $transaction[1];
                $paid_code = "HP".$grade;

                $user = DB::table('students')->where('mshs', $mshs)->first();
                if($user != null){
                    $student_name = $user->sur_name." ".$user->name;
                }
                else{
                    $student_name = "noname";
                }
                
                $dateString = $transaction[9];
                $date = new DateTime($dateString);
                $month = $date->format('n'); 

                Transaction::create([
                    'mshs'              => $mshs,
                    'student_name'          => $student_name,
                    'amount_paid'      => $transaction[8],
                    'paid_code'             => $paid_code,
                    'payment_date'           => $month,
                    'note'           => $transaction[4],
                    'invoice_no' => 'DN0001'
                ]);  
            }
             $firstline = false;
        }
        fclose($input_file);
       
    }
}
