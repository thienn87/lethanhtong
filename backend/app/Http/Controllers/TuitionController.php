<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TuitionFee;
use App\Models\TuitionGroup;
use App\Models\Classes;

use App\Repositories\TuitionRepository;

class TuitionController extends Controller
{   
    public function update(Request $request)
    {   
        if ( 
            empty($request->code) ||
            empty($request->name) ||
            empty($request->default_amount) ||
            empty($request->grade) ||
            empty($request->month_apply) ||
            empty($request->groupcode)
            ) { 
            return response()->json([
                'status' => false,
                'data' => 'empty required field from frontend'
            ]);
        }
        $repository = new TuitionRepository();
        $update = $repository->updateTuition( $request->all() );

        return response()->json([
            'status' => true,
            'data' => $update
        ]);
    }
    
    public function delete(Request $request){

        $repository = new TuitionRepository();
        $delete = $repository->deleteTuition( $request->all() );

        return response()->json([
            'message' => true,
            'data' => $delete
        ]);

    }

    public function createGroup(Request $request)
    {
        if ( 
            empty($request->code) ||
            empty($request->name) ||
            empty($request->default_amount) ||
            empty($request->grade) ||
            empty($request->month_apply)
            ) { 
            return response()->json([
                'status' => false,
                'data' => 'empty required field from frontend'
            ]);
        }

        $feeGroupCreatingStatus = TuitionGroup::create([
            'code' => $request->code,
            'name' => $request->name,
            'default_amount' => $request->default_amount,
            'grade' => $request->grade,
            'month_apply' => $request->month_apply,
            'group' => $request->groupcode
        ]);

        return response()->json([
            'status' => true,
            'data' => $feeGroupCreatingStatus
        ]);
    }

    /** Refactored & tested **/


    public function getListTuition()
    {
        $tuitionList = TuitionFee::all();
        return response()->json([
            'success' => true,
            'data' => $tuitionList,
        ]);
    }

    public function getGroup(Request $request)
    {
        $tuitionGroups = TuitionGroup::all();
        // Lấy tất cả các lớp
    $classes = Classes::all();

    // Duyệt qua từng nhóm học phí và kiểm tra lớp nào áp dụng
    $tuitionGroups->transform(function ($group) use ($classes) {
        // Tìm các lớp mà tuition_group_ids chứa mã của nhóm học phí hiện tại
        $appliedClasses = $classes->filter(function ($class) use ($group) {
            // Giải mã tuition_group_ids từ dạng JSON
            $tuitionGroupIds = json_decode($class->tuition_group_ids, true) ?? [];
            return in_array($group->code, $tuitionGroupIds);
        });

        // Thêm danh sách các lớp đã áp dụng vào nhóm học phí
        $group->applied_classes = $appliedClasses->pluck('name'); // Chỉ lấy tên lớp

        return $group;
    });
        return response()->json([
            'status' => 'success',
            'data' => $tuitionGroups
        ]);
    }
    public function getTuitionName(Request $request)
    {
        // Validate the request to ensure 'code' is provided
        $request->validate([
            'code' => 'required|string',
        ]);

        // Find the tuition by code
        $tuition = TuitionGroup::where('code', $request->code)->first();

        if ($tuition) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'code' => $tuition->code,
                    'name' => $tuition->name,
                ],
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Tuition code not found',
            ], 404);
        }
    }
}
