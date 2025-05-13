<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use App\Http\Controllers\TuitionMonthlyFeeListingController;
class StudentImportController extends Controller
{
    public function import(Request $request)
    {
        // Validate that a file was uploaded
        if (!$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy file tải lên'
            ], 400);
        }

        $file = $request->file('file');

        // Validate file type
        $allowedMimeTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];

        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            return response()->json([
                'success' => false,
                'message' => 'File không đúng định dạng. Vui lòng sử dụng file Excel (.xlsx, .xls) hoặc CSV'
            ], 400);
        }

        try {
            // Load the spreadsheet
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Check if the file has data
            if (count($rows) <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'File không chứa dữ liệu học sinh'
                ], 400);
            }

            // Get headers from the first row
            $headers = $rows[0];
            $expectedHeaders = [
                'sur_name', 'name', 'day_of_birth', 'grade', 'class_id', 
                'gender', 'discount', 'stay_in', 'leave_school', 'fail_grade',
                'parent_name', 'phone_number', 'address', 'day_in', 'day_out'
            ];

            // Validate headers
            $missingHeaders = array_diff($expectedHeaders, $headers);
            if (!empty($missingHeaders)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File thiếu các cột bắt buộc',
                    'errors' => ['Các cột thiếu: ' . implode(', ', $missingHeaders)]
                ], 400);
            }

            // Process data rows
            $dataRows = array_slice($rows, 1);
            $importedCount = 0;
            $errors = [];
            
            // Track used MSHS values to ensure uniqueness within the import batch
            $usedMshs = [];
            
            // Get the highest MSHS value from the database to start from
            $latestStudent = Student::orderBy('mshs', 'desc')->first();
            
            // Modified: Convert to string to ensure proper handling of MSHS
            $nextMshs = $latestStudent ? (string)((int)$latestStudent->mshs + 1) : '100001';

            foreach ($dataRows as $index => $row) {
                $rowNumber = $index + 2; // +2 because index starts at 0 and we skip header row
                
                // Map row data to columns
                $rowData = array_combine($headers, $row);
                
                // Skip empty rows
                if (empty(array_filter($rowData))) {
                    continue;
                }

                // Validate required fields
                $validator = Validator::make($rowData, [
                    'sur_name' => 'required|string|max:255',
                    'name' => 'required|string|max:255',
                    'grade' => 'required|string|max:10',
                    'class_id' => 'required|string|max:10',
                    'parent_name' => 'required|string|max:255',
                    'phone_number' => 'required|string|max:20',
                    'address' => 'required|string',
                ]);

                if ($validator->fails()) {
                    $rowErrors = $validator->errors()->all();
                    $errors[] = "Dòng {$rowNumber}: " . implode(', ', $rowErrors);
                    continue;
                }

                // Process boolean fields
                $stayIn = $rowData['stay_in'];
                $leaveSchool = $rowData['leave_school'];
                $failGrade = $rowData['fail_grade'];

                // Process date fields
                try {
                    $dayOfBirth = $this->parseDate($rowData['day_of_birth']);
                    $dayIn = $this->parseDate($rowData['day_in']);
                    $dayOut = !empty($rowData['day_out']) ? $this->parseDate($rowData['day_out']) : null;
                } catch (\Exception $e) {
                    $errors[] = "Dòng {$rowNumber}: Lỗi định dạng ngày tháng. Vui lòng sử dụng định dạng DD/MM/YYYY";
                    continue;
                }

                // Generate a unique MSHS (student ID)
                $newMshs = $nextMshs;
                
                // Check if this MSHS already exists in the database
                while (Student::where('mshs', $newMshs)->exists() || in_array($newMshs, $usedMshs)) {
                    // Modified: Increment as string to ensure proper handling of MSHS
                    $nextMshs = (string)((int)$nextMshs + 1);
                    $newMshs = $nextMshs;
                }
                
                // Add this MSHS to the used list
                $usedMshs[] = $newMshs;
                
                // Increment for the next student
                // Modified: Increment as string to ensure proper handling of MSHS
                $nextMshs = (string)((int)$nextMshs + 1);
                $monthlyTuition = new TuitionMonthlyFeeListingController();
                try {
                    // Create student record
                    Student::create([
                        'mshs' => $newMshs,
                        'sur_name' => $rowData['sur_name'],
                        'name' => $rowData['name'],
                        'full_name' => $rowData['sur_name'] . ' ' . $rowData['name'],
                        'day_of_birth' => $dayOfBirth,
                        'grade' => $rowData['grade'],
                        'class' => $rowData['class_id'],
                        'stay_in' => $stayIn,
                        'gender' => strtolower($rowData['gender']) === 'female' ? 'female' : 'male',
                        'discount' => intval($rowData['discount'] ?? 0),
                        'leave_school' => $leaveSchool,
                        'parent_name' => $rowData['parent_name'],
                        'address' => $rowData['address'],
                        'phone_number' => $rowData['phone_number'],
                        'day_in' => $dayIn,
                        'day_out' => $dayOut,
                        'fail_grade' => $failGrade,
                    ]);
                    $monthlyTuition->addNewStudentToTuitionMonthlyGroup($newMshs);
                    $importedCount++;
                } catch (\Exception $e) {
                    Log::error('Error importing student: ' . $e->getMessage());
                    $errors[] = "Dòng {$rowNumber}: Lỗi khi lưu dữ liệu - " . $e->getMessage();
                }
            }

            // Return response
            if ($importedCount > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Đã nhập thành công {$importedCount} học sinh",
                    'imported' => $importedCount,
                    'errors' => $errors
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể nhập dữ liệu học sinh',
                    'errors' => $errors
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Error processing Excel file: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xử lý file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse date from various formats
     * 
     * @param string $dateString
     * @return string
     */
    private function parseDate($dateString)
    {
        if (empty($dateString)) {
            throw new \Exception('Date string is empty');
        }

        // Try to parse date from common formats
        try {
            // For DD/MM/YYYY format
            if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $dateString)) {
                $parts = explode('/', $dateString);
                return Carbon::createFromDate($parts[2], $parts[1], $parts[0])->format('Y-m-d');
            }
            
            // For Excel date format (numeric)
            if (is_numeric($dateString)) {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateString))->format('Y-m-d');
            }
            
            // Try with Carbon parser
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            throw new \Exception('Invalid date format: ' . $dateString);
        }
    }
}