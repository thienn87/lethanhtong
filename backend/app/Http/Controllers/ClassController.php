<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\TuitionGroup;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class ClassController extends Controller
{
    public function index()
    {
        $classes = Classes::all();

        return response()->json([
            'status' => true,
            'data' => $classes,
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'grade' => 'required',
            'name' => 'required',
        ]);

        $class = Classes::create($validated);

        return response()->json([
            'status' => true,
            'data' => $class,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'grade' => 'required',
            'name' => 'required|unique:classes,name,' . $id,
        ]);

        $class = Classes::findOrFail($id);
        $class->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Thông tin lớp học đã được cập nhật.',
            'data' => $class,
        ]);
    }

        
    public function destroy(Request $request)
    {
        $id = $request->query('id');
        if (!$id) {
            return response()->json([
                'status' => false,
                'message' => 'Thiếu ID lớp cần xóa.'
            ], 400);
        }

        $class = Classes::find($id);
        if (!$class) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy lớp.'
            ], 404);
        }

        $class->delete();

        return response()->json([
            'status' => true,
            'message' => 'Lớp học đã được xóa.'
        ]);
    }

    /**
     * Get all classes for a specific grade
     *
     * @param  string  $grade
     * @return \Illuminate\Http\JsonResponse
     */
    public function getClassesByGrade($grade)
    {
        try {
            // Validate grade input
            if (empty($grade)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grade parameter is required'
                ], 400);
            }
            
            // Query classes for the specified grade
            $classes = DB::table('classes')
                ->where('grade', $grade)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
            
        } catch (\Exception $error) {
            Log::error('Error fetching classes by grade: ' . $error->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Server error',
                'error' => $error->getMessage()
            ], 500);
        }
    }
}
