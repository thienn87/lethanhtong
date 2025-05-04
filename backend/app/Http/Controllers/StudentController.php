<?php
namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classes;
use Illuminate\Http\Request;

use App\Repositories\StudentRepository;
use App\Services\SearchService;

use App\Jobs\UpgradeStudentsJob;
use App\Models\StudentBalance;

class StudentController extends Controller
{   
    public function get(Request $request)
    {
        $perPage = 10;
        $page = $request->input('page', 1);

        $students = Student::skip(($page - 1) * $perPage)->take($perPage)->get();
        
        return response()->json([
            'status' => true,
            'data' => $students,
        ]);
    }

    public function update(Request $request){

        $student = Student::where('mshs', $request->input('mshs') )->first();

        if (!$request->input('mshs')) {
            return response()->json([
                'status' => false, 
                'message' => 'Need MSHS on param'], 404);
        }

        if (!$student) {
            return response()->json([
                'status' => false, 
                'message' => 'Not found student with mshs'], 404);
        }
        $updateStudentRepository = new StudentRepository();
        $status = $updateStudentRepository->updateStudent($request->all());

        return response()->json([
            'status' => $status
        ], 200);
    }

    public function create(Request $request){
        try {
            // Get the latest student record and generate a new MSHS
            $latestStudent = Student::orderBy('mshs', 'desc')->first();
            $newMshs = $latestStudent ? (intval($latestStudent->mshs) + 1) : 100001;
            
            // Check if this MSHS already exists in the database
            while (Student::where('mshs', $newMshs)->exists()) {
                $newMshs++;
            }
            
            // Create the student record
            Student::create([
                'mshs' => $newMshs,
                'sur_name' => $request->input('sur_name'),
                'name' => $request->input('name'),
                'full_name' => $request->input('sur_name') . ' ' . $request->input('name'),
                'day_of_birth' => $request->input('day_of_birth'),
                'grade' => $request->input('grade'),
                'class' => $request->input('class_id'),
                'stay_in' => $request->input('stay_in'),
                'gender' => $request->input('gender'),
                'discount' => $request->input('discount', 0), // Giá trị mặc định là 0 nếu không có
                'leave_school' => $request->input('leave_school'),
                'parent_name' => $request->input('parent_name'),
                'address' => $request->input('address'),
                'phone_number' => $request->input('phone_number'),
                'day_in' => $request->input('day_in'),
                'day_out' => $request->input('day_out'), // nullable
                'fail_grade' => $request->input('fail_grade'),
            ]);
            // Create the student balance record            
            StudentBalance::create([
                'mshs' => $newMshs,
                'balance' => 0
            ]);
            
            return response()->json([
                'status' => 'success',
                'mshs' => $newMshs // Return the generated MSHS to the client
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không thể tạo học sinh mới: ' . $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request){   
        $search = new SearchService();
        $result = $search->index($request);
        return response()->json([
            'status' => true,
            'data' => $result
        ]);
    }

    public function delete(Request $request){
        $repository = new StudentRepository();
        $delete = $repository->deleteStudent( $request->all() );

        return response()->json([
            'message' => true,
            'data' => $delete
        ]);
    }

    public function upgrade(Request $request){

        dispatch(new UpgradeStudentsJob());

        return response()->json([
            'status' => 'success',
            'message' => 'Upgrading students will be processed in the background.'
        ]);

    }
    /**
     * Get all students (basic info only)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllStudents()
    {
        try {
            // Only select the fields we need to minimize data transfer
            $students = Student::select('id', 'mshs', 'name', 'sur_name', 'grade', 'class')
                ->where('leave_school', false) // Only include active students
                ->orderBy('grade')
                ->orderBy('class')
                ->orderBy('sur_name')
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'status' => 'success',
                'data' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve students: ' . $e->getMessage()
            ], 500);
        }
    }
}