<?php

namespace App\Exports;

use App\Models\Student;
use App\Models\TuitionGroup;
use App\Models\Transaction;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StudentsExport implements FromCollection, WithHeadings
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // Lấy danh sách học sinh
        $students = Student::all();

        // Xử lý dữ liệu cần thiết
        $data = $students->map(function ($student) {
            // Lấy thông tin doanh thu, số phải thu và công nợ từng tháng

            return [
                'id' => $student->id,
                'mshs' => $student->mshs,
                'ho' => $student->sur_name,
                'ten' => $student->name,
                'ngay_sinh' => $student->day_of_birth,
                'khoi' => $student->grade,
                'lop' => $student->class,
                // 'gioi_tinh' => $student->gioi_tinh,
                'phu_huynh' => $student->parent_name,
                'dia_chi' => $student->address,
                'so_dien_thoai' => $student->phone_number,

                'doanh_thu_thang_1' => $this->getMonthlyRevenue($student->mshs, 1),
                'phai_thu_thang_1' => $this->getMonthlyDebt($student->grade, 1),
                'cong_no_thang_1' => $this->getOutstandingDebt($student->mshs, $student->grade, 1),

                'doanh_thu_thang_2' => $this->getMonthlyRevenue($student->mshs, 2),
                'phai_thu_thang_2' => $this->getMonthlyDebt($student->grade, 2),
                'cong_no_thang_2' => $this->getOutstandingDebt($student->mshs, $student->grade, 2),

                'doanh_thu_thang_3' => $this->getMonthlyRevenue($student->mshs, 3),
                'phai_thu_thang_3' => $this->getMonthlyDebt($student->grade, 3),
                'cong_no_thang_3' => $this->getOutstandingDebt($student->mshs, $student->grade, 3),

                'doanh_thu_thang_4' => $this->getMonthlyRevenue($student->mshs, 4),
                'phai_thu_thang_4' => $this->getMonthlyDebt($student->grade, 4),
                'cong_no_thang_4' => $this->getOutstandingDebt($student->mshs, $student->grade, 4),

                'doanh_thu_thang_5' => $this->getMonthlyRevenue($student->mshs, 5),
                'phai_thu_thang_5' => $this->getMonthlyDebt($student->grade, 5),
                'cong_no_thang_5' => $this->getOutstandingDebt($student->mshs, $student->grade, 5),

                'doanh_thu_thang_6' => $this->getMonthlyRevenue($student->mshs, 6),
                'phai_thu_thang_6' => $this->getMonthlyDebt($student->grade, 6),
                'cong_no_thang_6' => $this->getOutstandingDebt($student->mshs, $student->grade, 6),

                'doanh_thu_thang_7' => $this->getMonthlyRevenue($student->mshs, 7),
                'phai_thu_thang_7' => $this->getMonthlyDebt($student->grade, 7),
                'cong_no_thang_7' => $this->getOutstandingDebt($student->mshs, $student->grade, 7),

                'doanh_thu_thang_8' => $this->getMonthlyRevenue($student->mshs, 8),
                'phai_thu_thang_8' => $this->getMonthlyDebt($student->grade, 8),
                'cong_no_thang_8' => $this->getOutstandingDebt($student->mshs, $student->grade, 8),

                'doanh_thu_thang_9' => $this->getMonthlyRevenue($student->mshs, 9),
                'phai_thu_thang_9' => $this->getMonthlyDebt($student->grade, 9),
                'cong_no_thang_9' => $this->getOutstandingDebt($student->mshs, $student->grade, 9),

                'doanh_thu_thang_10' => $this->getMonthlyRevenue($student->mshs, 10),
                'phai_thu_thang_10' => $this->getMonthlyDebt($student->grade, 10),
                'cong_no_thang_10' => $this->getOutstandingDebt($student->mshs, $student->grade, 10),

                'doanh_thu_thang_11' => $this->getMonthlyRevenue($student->mshs, 11),
                'phai_thu_thang_11' => $this->getMonthlyDebt($student->grade, 11),
                'cong_no_thang_11' => $this->getOutstandingDebt($student->mshs, $student->grade, 11),

                'doanh_thu_thang_12' => $this->getMonthlyRevenue($student->mshs, 12),
                'phai_thu_thang_12' => $this->getMonthlyDebt($student->grade, 12),
                'cong_no_thang_12' => $this->getOutstandingDebt($student->mshs, $student->grade, 12),
            ];
        });

        return new Collection($data);
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID', 'MSHS', 'Họ', 'Tên', 'Ngày sinh', 'Khối', 'Lớp',
            'Giới tính', 'Phụ huynh', 'Địa chỉ', 'Số điện thoại', 'Ngày vào', 'Ngày ra', 'Nội trú',
            'Đã rời trường', 'Ở lại lớp', 
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
            'Doanh thu tháng 12', 'Phải thu tháng 12', 'Công nợ tháng 12'
        ];
    }

    /**
     * Lấy doanh thu từng tháng của học sinh
     */
    private function getMonthlyRevenue($mshs, $month)
    {
        return Transaction::where('mshs', $mshs)
            ->where('payment_date', $month)
            ->get();
    }

    private function getOutstandingDebt($mshs, $grade, $month)
    {
        // Tính tổng doanh thu từ getMonthlyRevenue
        $monthlyRevenue = $this->getMonthlyRevenue($mshs, $month)->sum('amount'); // Thay 'amount' bằng tên cột chứa giá trị doanh thu trong bảng `Transaction`
        
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
}