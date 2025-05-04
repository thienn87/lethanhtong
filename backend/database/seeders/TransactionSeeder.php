<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Services\SearchService;
use App\Models\Transaction;
use Carbon\Carbon;
class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $searchService = new SearchService();

        Transaction::truncate();
        $firstline = true;
        $input_file = fopen(base_path("database/THANG2.csv"), "r");
        while (($data = fgetcsv($input_file, null, ";")) !== FALSE) {
            if (!$firstline) {
                $transaction = $data;
                $mshs = $transaction[3];
                $hp = $transaction[9];
                $bt = $transaction[10];
                $nt = $transaction[11];
                $lpnt = $transaction[12];
                $paid_code = "";

                $user = DB::table('students')->where('mshs', $mshs)->first();
                if($user != null){
                    $student_name = $user->sur_name." ".$user->name;
                    $grade = $user->grade;
                    $grade = sprintf('%02d', $grade);
                }
                else{
                    $student_name = "noname";
                }

                if($hp != 0){
                    $paid_code = "HP".$grade;
                    if($hp == 2430000){
                        $paid_code = "HP06";
                    }
                    if($hp == 2580000){
                        $paid_code = "HP07";
                    }
                    if($hp == 2730000){
                        $paid_code = "HP08";
                    }
                    if($hp == 3080000){
                        $paid_code = "HP09";
                    }
                    if($hp == 3480000){
                        $paid_code = "HP010";
                    }
                    if($hp == 3790000){
                        $paid_code = "HP11";
                    }
                    if($hp == 4650000){
                        $paid_code = "HP12";
                    }
                    Transaction::create([
                        'mshs'              => $transaction[3],
                        'student_name'          => $student_name,
                        'amount_paid'      => $hp,
                        'paid_code'             => $paid_code,
                        'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                        'note'           => $transaction[7],
                        'invoice_no'           => $transaction[0],
                    ]);  
                    if($bt != 0){
                        $paid_code = "BT".$grade;
                        if($bt == 1860000){
                            $paid_code = "BT06";
                        }
                        if($bt == 1860000){
                            $paid_code = "BT07";
                        }
                        if($bt == 1860000){
                            $paid_code = "BT08";
                        }
                        if($bt == 1940000){
                            $paid_code = "BT09";
                        }
                        if($bt == 2000000){
                            $paid_code = "BT010";
                        }
                        if($bt == 2060000){
                            $paid_code = "BT11";
                        }
                        if($bt == 2120000){
                            $paid_code = "BT12";
                        }
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $bt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                    if($nt != 0){
                        $paid_code = "NT".$grade;
                        if($nt == 4200000){
                            $paid_code = "NT10";
                        }
                        if($nt == 4300000){
                            $paid_code = "NT11";
                        }
                        if($nt == 4500000){
                            $paid_code = "NT12";
                        }
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $nt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                    if($lpnt !=0){
                        $paid_code = "LPNT";
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $lpnt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                }
                elseif($bt != 0){
                    $paid_code = "BT".$grade;
                    if($bt == 1860000){
                        $paid_code = "BT06";
                    }
                    if($bt == 1860000){
                        $paid_code = "BT07";
                    }
                    if($bt == 1860000){
                        $paid_code = "BT08";
                    }
                    if($bt == 1940000){
                        $paid_code = "BT09";
                    }
                    if($bt == 2000000){
                        $paid_code = "BT010";
                    }
                    if($bt == 2060000){
                        $paid_code = "BT11";
                    }
                    if($bt == 2120000){
                        $paid_code = "BT12";
                    }
                    Transaction::create([
                        'mshs'              => $transaction[3],
                        'student_name'          => $student_name,
                        'amount_paid'      => $bt,
                        'paid_code'             => $paid_code,
                        'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                        'note'           => $transaction[7],
                        'invoice_no'           => $transaction[0],
                    ]);  
                    if($nt != 0){
                        $paid_code = "NT".$grade;
                        if($nt == 4200000){
                            $paid_code = "NT10";
                        }
                        if($nt == 4300000){
                            $paid_code = "NT11";
                        }
                        if($nt == 4500000){
                            $paid_code = "NT12";
                        }
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $nt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                    if($lpnt !=0){
                        $paid_code = "LPNT";
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $lpnt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                }
                elseif($nt != 0){
                    $paid_code = "NT".$grade;
                    if($nt == 4200000){
                        $paid_code = "NT10";
                    }
                    if($nt == 4300000){
                        $paid_code = "NT11";
                    }
                    if($nt == 4500000){
                        $paid_code = "NT12";
                    }
                    Transaction::create([
                        'mshs'              => $transaction[3],
                        'student_name'          => $student_name,
                        'amount_paid'      => $nt,
                        'paid_code'             => $paid_code,
                        'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                        'note'           => $transaction[7],
                        'invoice_no'           => $transaction[0],
                    ]);  
                    if($lpnt !=0){
                        $paid_code = "LPNT";
                        Transaction::create([
                            'mshs'              => $transaction[3],
                            'student_name'          => $student_name,
                            'amount_paid'      => $lpnt,
                            'paid_code'             => $paid_code,
                            'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                            'note'           => $transaction[7],
                            'invoice_no'           => $transaction[0],
                        ]);  
                    }
                }
                else{
                    $paid_code = "LPNT";
                    Transaction::create([
                        'mshs'              => $transaction[3],
                        'student_name'          => $student_name,
                        'amount_paid'      => $lpnt,
                        'paid_code'             => $paid_code,
                        'payment_date'           => Carbon::createFromFormat('d/m/Y', $transaction[1])->month,
                        'note'           => $transaction[7],
                        'invoice_no'           => $transaction[0],
                    ]);  
                }
                
            }
            $firstline = false;
        }
        fclose($input_file);
       
    }
}