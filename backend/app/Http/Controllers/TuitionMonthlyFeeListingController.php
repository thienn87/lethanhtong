<?php

namespace App\Http\Controllers;

use App\Models\TuitionMonthlyFeeListing;
use App\Models\TuitionGroup;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;

class TuitionMonthlyFeeListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //hiển thị danh sách 
        $tuititionsMothlyFees = TuitionMonthlyFeeListing::all();
        
        return response()->json([
            'status' => 'success',
            'data' => $tuititionsMothlyFees,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     * Request $request
     */
    public function create()
    {
        /*Get current Date and Year */
        $currentMonth = date('m');
        $currentYear = date('Y');
        /*Get the month in the last record and compare with current month */
        $dbMonth = TuitionMonthlyFeeListing::latest('month')->first();
        $dbYear = TuitionMonthlyFeeListing::latest('year')->first();

        if(($currentMonth < $dbMonth) && ($currentYear < $dbYear)){
            //do script here
            // return $this->dataProcessing();
            //
        }
        //The processing function here for testing
        return $this->dataProcessing();

    }
    private function dataProcessing(){
        $currentMonth = date('m');
        $currentYear = date('Y');
        //Get 10 records for testing. Should remove ->take(10) in real life
        $students = DB::table('students')->get()->take(10);
        foreach ($students as $student) {
            $student_mshs = $student->mshs;
            $student_name = $student->full_name;
            $student_grade =  $student->grade;
            $student_noitru = $student->stay_in;
            //Giá trị mặc định đã thu 
            $student_dathu = 0;
           
            $student_transaction_id = "";
            /*Liệt kê các học phí cố định từng tháng 
            Nếu học sinh nội trú thì thêm phí nội trú
            Chuối mã HP để query sau này
            Kiểm tra phí, nếu có phí áp dụng trong tháng thì thêm vào
            */
            $mahp = "";
            if($student_noitru == "TRUE"){  
                $tuitions = TuitionGroup::where('classes',  $student_grade)
                                                ->whereRaw("(',' || apply_months || ',') LIKE '%,$currentMonth,%'")
                                                ->orwhere([['group',  'HP']], [['group',  'BT']], [['group',  'NT']])
                                                ->orwhere([['apply_months','like', '%'.$currentMonth.'%']])
                                                ->get(); 
            }
            else{
                $tuitions = TuitionGroup::where('classes',  $student_grade)
                                                ->orwhere([['group',  'HP'], ['group',  'BT']])
                                                ->orwhere([['apply_months','like', '%'.$currentMonth.'%']])
                                                ->get(); 
            }
            /*Số tiền phải thu trong tháng*/
            $student_phaithu = 0;
            
            foreach ($tuitions as $tuition){
                $mahp .= $tuition->code.",";  
                $soTien = $tuition->default_amount;
                /*Số tiền phải thu trong tháng được cộng dồn từ học phí cố định */
                $student_phaithu += $soTien;
            }
            $mahp = rtrim($mahp, ",");
            /*Tìm số dư cuối của học sinh trong tháng trước đó để tính số dư đầu*/
            //Nếu Tháng trước là tháng 12 thì query theo năm trước.
            /*Need to test after have real data */
            if($currentMonth == 1){
                $lastMonth = 12;
                $lastYear = $currentYear - 1;
            }
            else{
                $lastMonth = $currentMonth-1;
                $lastYear = $currentYear;
            }
            $tuition_list_du_no = TuitionMonthlyFeeListing::where([['mshs', $student_mshs],['month', $lastMonth],['year', $lastYear]])->first();
            if (empty($tuition_list_du_no)) { 
                $student_dudau =  $student_phaithu;
            }
            else{
                $student_dudau = $tuition_list_du_no->duno +  $student_phaithu;
            }
            $student_duno = $student_dudau - $student_dathu;
            TuitionMonthlyFeeListing::create([
                'month' => $currentMonth,
                'year' => $currentYear,
                'mshs' => $student_mshs,
                'student_name' => $student_name,
                'tuitions' => $mahp,
                'dudau' => $student_dudau,
                'phaithu' => $student_phaithu,
                'dathu' => $student_dathu,
                'duno' =>  $student_duno,
                'transaction_id' => $student_transaction_id
            ]);
        }
    }
  

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
