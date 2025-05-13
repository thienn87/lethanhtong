<?php
namespace App\Jobs;

use App\Models\Student;
use App\Models\TuitionGroup;
use App\Models\Transaction;
use Illuminate\Support\Facades\Storage;

use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;



class ExportStudentsJobFilter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $keyword;
    public $class;
    public $grade;

    public function __construct($keyword, $class, $grade)
    {
        $this->keyword = $keyword;
        $this->class = $class;
        $this->grade = $grade;
    }
    private function getMonthlyRevenue($mshs, $month)
    {
        $transactions = Transaction::where('mshs', $mshs)
        ->where('payment_date', $month)
        ->get();

        // Nếu không có kết quả, trả về 0
        return $transactions->sum('amount');
    }

    private function getOutstandingDebt($mshs, $grade, $month)
    {
        // Tính tổng doanh thu từ getMonthlyRevenue
        $monthlyRevenue = $this->getMonthlyRevenue($mshs, $month);
        
        // Lấy công nợ từ getMonthlyDebt
        $monthlyDebt = $this->getMonthlyDebt($grade, $month);

        // Trả về kết quả
        return $monthlyRevenue - $monthlyDebt;
    }

    /**
     * Lấy công nợ từng tháng của học sinh
     */
    private function getMonthlyDebt($grade, $month)
    {
        $debt = 0;
        // $tuition_apply = [];
        $tuitionGroups = TuitionGroup::all();
        foreach ($tuitionGroups as $group) {
            $classCode = $group->grade;  // Mã lớp (6, 7, ...)
            $amount = $group->default_amount;  // Học phí mặc định
            $monthApply = $group->month_apply; 
            // Lấy ra các tháng được setup để đóng 
            if( strpos($monthApply,',') > 0 ){
                // nếu có dấu phẩy thì cắt nó ra để so sánh logic 
                $monthApplyResult = explode(",",$group->month_apply);
            }
            else if(!$group->month_apply){
                // nếu null thì loại bỏ loại học phí này 
                $monthApplyResult = [];
            }
            else {
                $monthApplyResult = [$group->month_apply];
            }
            if( 
              $classCode === $grade // nếu học phí áp dụng cho khối ví dụ HP6 áp dụng khối 6 
              && in_array($month, $monthApplyResult) // tháng hiện tại nằm trong mảng được phép áp dụng, ví dụ giờ tháng 11, mà mảng là [11,12,01]
             ){
                /**
                 * Điều kiện 1 : nếu đúng khối hoặc phí áp dụng toàn trường
                 * Điều kiện 2 : nếu đúng tháng mà lệ phí học phí setup
                 * **/ 
                // array_push($tuition_apply,$group);
                $debt = $debt + $amount; // học phí phải đóng
            }
        }
        return $debt;
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
