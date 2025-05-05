<?php

namespace App\Http\Controllers;

use App\Models\Grades;

use Illuminate\Http\Request;

class GradeController extends Controller
{
    // Hiển thị danh sách khối học kèm ngày tạo
    public function index()
    {
        $grades = Grades::all();

        return response()->json([
            'status' => 'success',
            'data' => $grades,
        ]);
    }

    public function create(Request $request)
    {
        $result = Grades::create([
            'grade' => $request->input('grade'),
            'name' => $request->input('name'),
            'tuition_group_ids' => $request->input('tuition_group_ids', []),
        ]);
        return response()->json([
            'status' => true,
            'message' => $result ? 'Khối đã được tạo hoặc cập nhật.' : 'Không thể tạo/cập nhật khối.'
        ]);
    }
}
