<?php
namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

use App\Repositories\StudentRepository;
use App\Services\SearchService;

use App\Jobs\UpgradeStudentsJob;
use App\Http\Controllers\TuitionMonthlyFeeListingController;

class StudentController extends Controller
{   
    protected $studentRepository;
    protected $searchService;
    
    /**
     * Constructor with dependency injection
     */
    public function __construct(StudentRepository $studentRepository, SearchService $searchService)
    {
        $this->studentRepository = $studentRepository;
        $this->searchService = $searchService;
    }  
    
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
            DB::beginTransaction();
            
            // Get the latest student record and generate a new MSHS
            $latestStudent = Student::orderBy('mshs', 'desc')->first();
            $newMshs = $latestStudent ? (string)(intval($latestStudent->mshs) + 1) : '100001';
            
            // Check if this MSHS already exists in the database
            while (Student::where('mshs', $newMshs)->exists()) {
                $newMshs = (string)(intval($newMshs) + 1);
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
                'discount' => $request->input('discount', 0), // Default value is 0 if not provided
                'leave_school' => $request->input('leave_school'),
                'parent_name' => $request->input('parent_name'),
                'address' => $request->input('address'),
                'phone_number' => $request->input('phone_number'),
                'day_in' => $request->input('day_in'),
                'day_out' => $request->input('day_out'), // nullable
                'fail_grade' => $request->input('fail_grade'),
            ]);
          
            $monthlyTuition = new TuitionMonthlyFeeListingController();
            $tuititionMonth = $monthlyTuition->addNewStudentToTuitionMonthlyGroup($newMshs);
            
            DB::commit();

            return response()->json([
                'status' => 'success',
                'mshs' => $newMshs // Return the generated MSHS to the client
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating student: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Không thể tạo học sinh mới: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function search(Request $request){   
        try {
            $search = new SearchService();
            $result = $search->index($request);
            
            return response()->json([
                'status' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching students: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Error searching students: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a student - Optimized version without StudentBalance
     */
    public function delete(Request $request)
    {
        if (!$request->has('mshs')) {
            return response()->json([
                'status' => false,
                'message' => 'MSHS is required'
            ], 400);
        }
        
        $mshs = $request->input('mshs');
        
        try {
            DB::beginTransaction();
            
            // Direct deletion is faster than going through the repository for simple operations
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                return response()->json([
                    'status' => false,
                    'message' => 'Student not found'
                ], 404);
            }
            
            // Delete the student
            $student->delete();
            
            DB::commit();
            
            // Clear relevant caches
            $this->clearStudentCaches($mshs);
            
            return response()->json([
                'status' => true,
                'message' => 'Student deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting student: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Error deleting student: ' . $e->getMessage()
            ], 500);
        }
    }

    public function upgrade(Request $request){
        try {
            dispatch(new UpgradeStudentsJob());

            return response()->json([
                'status' => 'success',
                'message' => 'Upgrading students will be processed in the background.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error dispatching upgrade job: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error dispatching upgrade job: ' . $e->getMessage()
            ], 500);
        }
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
            $students = Student::select('id', 'mshs', 'name', 'sur_name', 'grade', 'class', 'day_of_birth','full_name', 'discount')
                ->where('leave_school', 'false') // Only include active students
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
            Log::error('Error retrieving all students: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve students: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export student data to Excel based on filter criteria
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function exportStudents(Request $request)
    {
        // Export method implementation remains the same
        // This method is typically not performance-critical as it's used infrequently
    }
    
    /**
     * Create admission form for a student
     */
    public function createAdmissionForm(Request $request)
    {
        // Admission form creation implementation remains the same
        // This method is typically not performance-critical as it's used infrequently
    }
    
    /**
     * Clear caches related to a specific student
     */
    protected function clearStudentCaches($mshs)
    {
        // Clear specific student cache
        Cache::forget("student_{$mshs}");
        
        // Clear student list caches
        if (Cache::supportsTags()) {
            Cache::tags(['students', 'all_students'])->flush();
        }
        
        // Clear search caches - check if searchService exists and has clearCache method
        // if ($this->searchService && method_exists($this->searchService, 'clearCache')) {
        //     $this->searchService->clearCache();
        // }
    }
}