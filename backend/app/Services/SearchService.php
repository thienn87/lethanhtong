<?php

namespace App\Services;

use App\Models\TuitionGroup;
use App\Models\Student;
use App\Models\Transaction;
use App\Models\Invoice;

class SearchService
{
    public function search_invoice($request)
    {
        $mshs = $request->input('mshs');
        $so_hoa_don = $request->input('so_hoa_don');
        $transactions = null;
        if (!empty($mshs) && empty($so_hoa_don)) {
            $student = Student::query()->where('mshs', $mshs)->first();
            $invoices = Invoice::query()->where('mshs', $mshs)->get();
        
            // Enrich từng invoice với transactions và student
            $invoices = $invoices->map(function ($invoice) {
                // Lấy các transaction liên quan
                $transaction_ids = explode(',', $invoice->transaction_id);
                $transactions = Transaction::query()
                    ->whereIn('id', $transaction_ids)
                    ->get();
        
                // Gắn thêm vào invoice
                $invoice->transactions = $transactions;
        
                // Gắn student luôn (nếu cần, ở đây bạn có thể bỏ nếu đã có sẵn)
                $invoice->student = Student::query()
                    ->where('mshs', $invoice->mshs)
                    ->first();
        
                return $invoice;
            });
        
            return $invoices;
        }

        elseif (!empty($so_hoa_don) && empty($mshs)) {
            $invoice = Invoice::query()->where('invoice_id', $so_hoa_don)->first();
        
            if (!$invoice) {
                return [];
            }
        
            // Tách các transaction_id nếu là chuỗi nhiều ID
            $transaction_ids = explode(',', $invoice->transaction_id);
        
            // Lấy danh sách transaction
            $transactions = Transaction::query()
                ->whereIn('id', $transaction_ids)
                ->get();
        
            // Gắn vào invoice
            $invoice->transactions = $transactions;
        
            // Lấy student đầu tiên theo mshs từ transaction
            $mshs = $transactions->first()->mshs ?? null;
            $student = $mshs ? Student::query()->where('mshs', $mshs)->first() : null;
        
            $invoice->student = $student;
        
            return $invoice;
        }        

        return false;
    }
    public static function getStudentOfInvoice($transaction_id)
    {
        $transaction = explode(",",$transaction_id)[0];
        $transaction_tracking = Transaction::query()->where('id', $transaction)->first()->mshs;
        $student = Student::query()->where('mshs',$transaction_tracking)->first();

        return $student;
    }
    public static function getTransactionOfInvoice($transaction_id)
    {
        $transaction_ids = explode(",", $transaction_id);

        $transactions = Transaction::query()
            ->whereIn('id', $transaction_ids)
            ->get();

        return $transactions;
    }

    // End search invoice
    //Start search học sinh
    public function index($request)
    {   
        $mshs = $request->input('mshs');
        $hasDiscount = $request->boolean('hasDiscount', false);
        
        if (!empty($mshs)) {
            $startTime = microtime(true);
            $binaryPath = base_path('database/databaseplusplus');
            $dbPath = base_path('database/database.sqlite');
            $command = "$binaryPath $dbPath search students mshs $mshs";
            $output = shell_exec($command);

            $endTime = microtime(true);
            $executionTime = $endTime - $startTime; // Thời gian thực thi trong giây

            if ($output) {
                $rows = explode("\n", trim($output)); // Tách theo dòng
                $data = [];
                foreach ($rows as $row) {
                    $columns = explode("|", $row);
                    $studentData = [
                        'id' => $columns[0],
                        'mshs' => $columns[1],
                        'sur_name' => $columns[2],
                        'name' => $columns[3],
                        'full_name' => $columns[4],
                        'day_of_birth' => $columns[5],
                        'grade' => $columns[6],
                        'class' => $columns[7],
                        'gender' => $columns[8],
                        'parent_name' => $columns[9],
                        'address' => $columns[10],
                        'phone_number' => $columns[11],
                        'day_in' => $columns[12],
                        'day_out' => $columns[13],
                        'stay_in' => $columns[14],
                        'leave_school' => $columns[15],
                        'fail_grade' => $columns[16],
                        'extra_fee' => $columns[17],
                        'extra_fee_note' => $columns[18] === '' ? null : $columns[18],
                        'discount' => $columns[19],
                        'created_at' => $columns[20],
                        'updated_at' => $columns[21],
                        'performance (s)' => $executionTime
                    ];
                    
                    // Apply discount filter if requested
                    if ($hasDiscount) {
                        if ((int)$columns[19] > 0) {
                            $data[] = $studentData;
                        }
                    } else {
                        $data[] = $studentData;
                    }
                }
                return $data;
            }
            // Trả về lỗi nếu không có kết quả trả về
            return null;
        } 

        $keyword = $this->removeVietnameseAccent(strtolower($request->input('keyword')));
        $keyword = strtolower($keyword);

        $class = $request->input('class');
        $grade = $request->input('grade');
        
        // Base query with discount filter if needed
        $baseQuery = Student::query();
        if ($hasDiscount) {
            $baseQuery->where('discount', '>', 0);
        }
        
        if (empty($class) && empty($grade)) {
            $results = $baseQuery
                ->where(function ($query) use ($keyword) {
                    $query->whereRaw('LOWER(full_name) like ?', ['%' . $keyword . '%'])
                          ->orWhere('mshs', 'like', '%' . $keyword . '%');
                })
                ->get();

            if ($results->isNotEmpty()) {
                return $results;
            }
        } 
        elseif (empty($class) && !empty($grade)) {
            $results = $baseQuery
                ->where('grade', $grade)
                ->where(function ($query) use ($keyword) {
                    $query->whereRaw('LOWER(full_name) like ?', ['%' . $keyword . '%']);
                })
                ->get();
            return $results;
        }
        elseif (!empty($class) && empty($grade)) {
            $results = $baseQuery
                ->where('class', $class)
                ->where(function ($query) use ($keyword) {
                    $query->whereRaw('LOWER(full_name) like ?', ['%' . $keyword . '%']);
                })
                ->get();
            return $results;
        }
        elseif (!empty($class) && !empty($grade)) {
            $results = $baseQuery
                ->where('grade', $grade)
                ->where('class', $class)
                ->where(function ($query) use ($keyword) {
                    $query->whereRaw('LOWER(full_name) like ?', ['%' . $keyword . '%']);
                })
                ->get();
            return $results;
        }
        return false; 
    }

    public function Transaction($request)
    {
        $keyword = strval($request->input('keyword'));
        $mshs = strval($request->input('mshs'));

        if (!empty($mshs)) {
            $results = Transaction::query()
            ->where(function ($query) use ($mshs) {
                $query->where('mshs', 'like', '%' . $mshs . '%');
            })
            ->get();
            return $results;
        }

        // Nếu có keyword, thực hiện tìm kiếm dựa trên keyword
        if (!empty($keyword)) {

            $cleanedKeyword = $this->removeVietnameseAccent($keyword);

            $results2 = Transaction::query()
            ->where(function ($query) use ($keyword) {
                $query->where('student_name', 'like', '%' . $keyword . '%');
            })
            ->get();
            if ($results2->isNotEmpty()) {
                return $results2;
            }
            
            $results = Transaction::query()
            ->where(function ($query) use ($cleanedKeyword) {
                $query->where('student_name', 'like', '%' . $cleanedKeyword . '%');
            })
            ->get();
            return $results;

        }

        // Nếu cả hai đều không tồn tại, trả về false hoặc thông báo
        return response()->json([
            'status' => false,
            'message' => 'No valid input provided'
        ], 400);
    }



    public function removeVietnameseAccent($str)
     {
         $accents = [
             'á'=>'a', 'à'=>'a', 'ả'=>'a', 'ã'=>'a', 'ạ'=>'a', 
             'ă'=>'a', 'ắ'=>'a', 'ằ'=>'a', 'ẳ'=>'a', 'ẵ'=>'a', 'ặ'=>'a', 
             'â'=>'a', 'ấ'=>'a', 'ầ'=>'a', 'ẩ'=>'a', 'ẫ'=>'a', 'ậ'=>'a', 
             'é'=>'e', 'è'=>'e', 'ẻ'=>'e', 'ẽ'=>'e', 'ẹ'=>'e', 
             'ê'=>'e', 'ế'=>'e', 'ề'=>'e', 'ể'=>'e', 'ễ'=>'e', 'ệ'=>'e', 
             'í'=>'i', 'ì'=>'i', 'ỉ'=>'i', 'ĩ'=>'i', 'ị'=>'i', 
             'ó'=>'o', 'ò'=>'o', 'ỏ'=>'o', 'õ'=>'o', 'ọ'=>'o', 
             'ô'=>'o', 'ố'=>'o', 'ồ'=>'o', 'ổ'=>'o', 'ỗ'=>'o', 'ộ'=>'o', 
             'ơ'=>'o', 'ớ'=>'o', 'ờ'=>'o', 'ở'=>'o', 'ỡ'=>'o', 'ợ'=>'o', 
             'ú'=>'u', 'ù'=>'u', 'ủ'=>'u', 'ũ'=>'u', 'ụ'=>'u', 
             'ư'=>'u', 'ứ'=>'u', 'ừ'=>'u', 'ử'=>'u', 'ữ'=>'u', 'ự'=>'u', 
             'ý'=>'y', 'ỳ'=>'y', 'ỷ'=>'y', 'ỹ'=>'y', 'ỵ'=>'y', 
             'đ'=>'d', 
             'Á'=>'A', 'À'=>'A', 'Ả'=>'A', 'Ã'=>'A', 'Ạ'=>'A', 
             'Ă'=>'A', 'Ắ'=>'A', 'Ằ'=>'A', 'Ẳ'=>'A', 'Ẵ'=>'A', 'Ặ'=>'A', 
             'Â'=>'A', 'Ấ'=>'A', 'Ầ'=>'A', 'Ẩ'=>'A', 'Ẫ'=>'A', 'Ậ'=>'A', 
             'É'=>'E', 'È'=>'E', 'Ẻ'=>'E', 'Ẽ'=>'E', 'Ẹ'=>'E', 
             'Ê'=>'E', 'Ế'=>'E', 'Ề'=>'E', 'Ể'=>'E', 'Ễ'=>'E', 'Ệ'=>'E', 
             'Í'=>'I', 'Ì'=>'I', 'Ỉ'=>'I', 'Ĩ'=>'I', 'Ị'=>'I', 
             'Ó'=>'O', 'Ò'=>'O', 'Ỏ'=>'O', 'Õ'=>'O', 'Ọ'=>'O', 
             'Ô'=>'O', 'Ố'=>'O', 'Ồ'=>'O', 'Ổ'=>'O', 'Ỗ'=>'O', 'Ộ'=>'O', 
             'Ơ'=>'O', 'Ớ'=>'O', 'Ờ'=>'O', 'Ở'=>'O', 'Ỡ'=>'O', 'Ợ'=>'O', 
             'Ú'=>'U', 'Ù'=>'U', 'Ủ'=>'U', 'Ũ'=>'U', 'Ụ'=>'U', 
             'Ư'=>'U', 'Ứ'=>'U', 'Ừ'=>'U', 'Ử'=>'U', 'Ữ'=>'U', 'Ự'=>'U', 
             'Ý'=>'Y', 'Ỳ'=>'Y', 'Ỷ'=>'Y', 'Ỹ'=>'Y', 'Ỵ'=>'Y', 
             'Đ'=>'D'
         ];
         
         return strtr($str, $accents);
     }
}