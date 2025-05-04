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

class ExportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filePath;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($filePath)
    {
        $this->filePath = $filePath; // Đường dẫn lưu file
    }

    /**
     * Execute the job.
     *
     * @return void
     */

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


    public function handle()
    {
        
        // Tên file CSV export

        // $filePath = storage_path('app/exports/students-' .now()->format('Y-m-d'). '.csv');
        $filePath = public_path('students-' . now()->format('Y-m-d') . '.csv');
        // $publicPath = storage_path('app/public/students-' . now()->format('Y-m-d') . '.csv');

        // Nếu file chưa tồn tại, tạo file và ghi header
        if (!file_exists($filePath)) {
            $header = [
                'MSHS', 'Tên học sinh', 'Ngày sinh', 'Tên', 'Phaitinh',
                'Khối', 'Lớp', 'Nội trú', 'Địa chỉ', 
                'Tên phụ huynh', 'Số điện thoại', 'Ngày vào', 'Ngày ra',
                'Lưu ban', 'chkval', 'Miễn giảm', 'Họ',
                'Doanh thu tháng 1', 'Phải thu tháng 1', 'Công nợ tháng 1',
                'Doanh thu tháng 2', 'Phải thu tháng 2', 'Công nợ tháng 2',
                'Doanh thu tháng 3', 'Phải thu tháng 3', 'Công nợ tháng 3',
                'Doanh thu tháng 4', 'Phải thu tháng 4', 'Công nợ tháng 4',
                'Doanh thu tháng 5', 'Phải thu tháng 5', 'Công nợ tháng 5',
                'Doanh thu tháng 6', 'Phải thu tháng 6', 'Công nợ tháng 6',
                'Doanh thu tháng 7', 'Phải thu tháng 7', 'Công nợ tháng 7',
                'Doanh thu tháng 8', 'Phải thu tháng 8', 'Công nợ tháng 8',
                'Doanh thu tháng 9', 'Phải thu tháng 9', 'Công nợ tháng 9',
                'Doanh thu tháng 10', 'Phải thu tháng 10', 'Công nợ tháng 10',
                'Doanh thu tháng 11', 'Phải thu tháng 11', 'Công nợ tháng 11',
                'Doanh thu tháng 12', 'Phải thu tháng 12', 'Công nợ tháng 12',
            ];

            $file = fopen($filePath, 'w');
            fwrite($file, "\xEF\xBB\xBF"); // Thêm BOM
            fputcsv($file, $header); // Ghi header
            fclose($file);
        }

        // Lấy danh sách học sinh và xử lý từng người
        $students = Student::cursor(); // Dùng cursor để giảm tải bộ nhớ
        $file = fopen($filePath, 'w');
        fwrite($file, "\xEF\xBB\xBF"); // Thêm BOM
        fputcsv($file, $header); // Ghi header

        foreach ($students as $student) {
            // Xử lý dữ liệu từng học sinh
            $row = [
                $student->mshs, $student->sur_name . ' ' . $student->name, $student->day_of_birth, $student->name,'',
                $student->grade, $student->class, $student->stay_in, $student->address,
                $student->parent_name,$student->phone_number,$student->day_in,$student->day_out,
                $student->fail_grade,'',$student->discount,$student->sur_name
            ];

            // Thêm thông tin doanh thu, công nợ từng tháng
            for ($month = 1; $month <= 12; $month++) {
                $row[] = $this->getMonthlyRevenue($student->mshs, $month);
                $row[] = $this->getMonthlyDebt($student->grade, $month);
                $row[] = $this->getOutstandingDebt($student->mshs, $student->grade, $month);
            }

            fputcsv($file, $row); //
        }
        fclose($file); 
        // Storage::move($filePath, $publicPath);

        // Excel::store(new StudentsExport, $this->filePath, 'local');
    }
}
