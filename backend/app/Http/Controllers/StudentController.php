<?php
namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classes;
use Illuminate\Http\Request;

use App\Repositories\StudentRepository;
use App\Services\SearchService;

use App\Jobs\UpgradeStudentsJob;
use App\Models\StudentBalance;
use App\Http\Controllers\TuitionMonthlyFeeListingController;

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
                'discount' => $request->input('discount', 0), // Giá trị mặc định là 0 nếu không có
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
            $students = Student::select('id', 'mshs', 'name', 'sur_name', 'grade', 'class', 'day_of_birth','full_name')
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
        try {
            // Use the same search service to get filtered students
            $search = new SearchService();
            $students = $search->index($request);
            
            if (!$students || (is_array($students) && count($students) === 0) || 
                (is_object($students) && $students->count() === 0)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Không tìm thấy học sinh nào phù hợp với tiêu chí tìm kiếm.'
                ], 404);
            }
            
            // Generate a unique filename
            $filename = 'danh-sach-hoc-sinh-' . date('Y-m-d-His') . '.xlsx';
            $filePath = storage_path('app/public/exports/' . $filename);
            
            // Make sure the directory exists
            if (!file_exists(storage_path('app/public/exports'))) {
                mkdir(storage_path('app/public/exports'), 0755, true);
            }
            
            // Create a new spreadsheet
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Set the spreadsheet metadata
            $spreadsheet->getProperties()
                ->setCreator('Hệ thống quản lý học sinh')
                ->setLastModifiedBy('Hệ thống quản lý học sinh')
                ->setTitle('Danh sách học sinh')
                ->setSubject('Danh sách học sinh')
                ->setDescription('Danh sách học sinh được xuất từ hệ thống quản lý');
            
            // Set column headers
            $sheet->setCellValue('A1', 'MSHS');
            $sheet->setCellValue('B1', 'Họ và tên đệm');
            $sheet->setCellValue('C1', 'Tên');
            $sheet->setCellValue('D1', 'Họ và tên');
            $sheet->setCellValue('E1', 'Ngày sinh');
            $sheet->setCellValue('F1', 'Khối');
            $sheet->setCellValue('G1', 'Lớp');
            $sheet->setCellValue('H1', 'Giới tính');
            $sheet->setCellValue('I1', 'Giảm học phí (%)');
            $sheet->setCellValue('J1', 'Phụ huynh');
            $sheet->setCellValue('K1', 'Số điện thoại');
            $sheet->setCellValue('L1', 'Địa chỉ');
            $sheet->setCellValue('M1', 'Ngày vào trường');
            $sheet->setCellValue('N1', 'Ngày ra trường');
            $sheet->setCellValue('O1', 'Nội trú');
            $sheet->setCellValue('P1', 'Nghỉ học');
            
            // Style the header row
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'], // Indigo color
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    ],
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                ],
            ];
            
            $sheet->getStyle('A1:P1')->applyFromArray($headerStyle);
            
            // Auto-size columns
            foreach (range('A', 'P') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
            
            // Add data rows
            $row = 2;
            foreach ($students as $student) {
                $sheet->setCellValue('A' . $row, $student->mshs);
                $sheet->setCellValue('B' . $row, $student->sur_name);
                $sheet->setCellValue('C' . $row, $student->name);
                $sheet->setCellValue('D' . $row, $student->full_name);
                
                // Format date of birth
                $dob = $student->day_of_birth ? date('d/m/Y', strtotime($student->day_of_birth)) : '';
                $sheet->setCellValue('E' . $row, $dob);
                
                $sheet->setCellValue('F' . $row, $student->grade);
                $sheet->setCellValue('G' . $row, $student->class);
                $sheet->setCellValue('H' . $row, $student->gender === 'male' ? 'Nam' : 'Nữ');
                $sheet->setCellValue('I' . $row, $student->discount);
                $sheet->setCellValue('J' . $row, $student->parent_name);
                $sheet->setCellValue('K' . $row, $student->phone_number);
                $sheet->setCellValue('L' . $row, $student->address);
                
                // Format day_in
                $dayIn = $student->day_in ? date('d/m/Y', strtotime($student->day_in)) : '';
                $sheet->setCellValue('M' . $row, $dayIn);
                
                // Format day_out
                $dayOut = $student->day_out ? date('d/m/Y', strtotime($student->day_out)) : '';
                $sheet->setCellValue('N' . $row, $dayOut);
                
                $sheet->setCellValue('O' . $row, $student->stay_in ? 'Có' : 'Không');
                $sheet->setCellValue('P' . $row, $student->leave_school ? 'Có' : 'Không');
                
                $row++;
            }
            
            // Apply styling to the data rows
            $dataStyle = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    ],
                ],
            ];
            
            $sheet->getStyle('A2:P' . ($row - 1))->applyFromArray($dataStyle);
            
            // Create Excel writer
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($filePath);
            
            // Return the file URL
            $fileUrl = url('storage/exports/' . $filename);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Xuất file Excel thành công',
                'filePath' => $fileUrl,
                'fileName' => $filename
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi khi xuất file Excel: ' . $e->getMessage()
            ], 500);
        }
    }
    public function createAdmissionForm(Request $request)
    {
        try {
            // Validate request
            if (!$request->has('mshs')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'MSHS is required'
                ], 400);
            }

            $mshs = $request->input('mshs');
            
            // Get student data
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found'
                ], 404);
            }
            
            // Load the Excel template
            $templatePath = public_path('phieunhaphoc.xlsx');
            if (!file_exists($templatePath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Template file not found'
                ], 404);
            }
            
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($templatePath);
            $sheet = $spreadsheet->getActiveSheet();
            
            // Determine if student is new or old
            $dayIn = new \DateTime($student->day_in);
            $now = new \DateTime();
            $interval = $dayIn->diff($now);
            $isNewStudent = $interval->days < 30; // Less than 1 month is considered new
            $studentStatus = $isNewStudent ? 'Mới' : 'Cũ';
            $stay_in = $student->stay_in ? 'Nội trú' : 'Bán trú';
            // Format dates
            $formattedDayIn = $student->day_in ? date('d/m/Y', strtotime($student->day_in)) : '';
            $formattedDob = $student->day_of_birth ? date('d/m/Y', strtotime($student->day_of_birth)) : '';
            
            // Fill in the template with student data
            $sheet->setCellValue('C4', $student->mshs);
            $sheet->setCellValue('C8', $student->sur_name." ".$student->name);
            $sheet->setCellValue('C9', $formattedDob);
            $sheet->setCellValue('C10', $student->grade.$student->class);
            $sheet->setCellValue('C11', $student->address);
            $sheet->setCellValue('C12', $student->parent_name);
            $sheet->setCellValue('C13', $studentStatus);
            $sheet->setCellValue('F13', "Phân loại: ".$stay_in);
            $sheet->setCellValue('F10', 'Ngày nhập học: '.$formattedDayIn);
            $sheet->setCellValue('F12', 'Điện thoại: '.$student->phone_number);
            $sheet->setCellValue('G8' , $student->mshs);
            $sheet->setCellValue('G9' , $student->gender === 'male' ? 'Nam' : 'Nữ');

            // Add current date at the bottom of the form
            $currentDate = date('d/m/Y');
            $sheet->setCellValue('F15', "Ngày " . date('d') . " tháng " . date('m') . " năm " . date('Y'));
            
            // Generate a unique filename
            $filename = 'phieu-nhap-hoc-' . $student->mshs . '-' . date('YmdHis') . '.xlsx';
            $filePath = storage_path('app/public/admission_forms/' . $filename);
            
            // Make sure the directory exists
            if (!file_exists(storage_path('app/public/admission_forms'))) {
                mkdir(storage_path('app/public/admission_forms'), 0755, true);
            }
            
            // Save the file
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($filePath);
            
            // Return the file URL
            $fileUrl = url('storage/admission_forms/' . $filename);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Phiếu nhập học đã được tạo thành công',
                'filePath' => $fileUrl,
                'fileName' => $filename
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi khi tạo phiếu nhập học: ' . $e->getMessage()
            ], 500);
        }
    }
}