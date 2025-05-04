<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;

class StudentUpdateController extends Controller
{
    public function updateBatch(Request $request)
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
            
            // Check if MSHS column exists (required for updates)
            $mshs_index = array_search('mshs', $headers);
            if ($mshs_index === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'File thiếu cột MSHS bắt buộc để xác định học sinh cần cập nhật'
                ], 400);
            }

            // Process data rows
            $dataRows = array_slice($rows, 1);
            $updatedCount = 0;
            $errors = [];

            foreach ($dataRows as $index => $row) {
                $rowNumber = $index + 2; // +2 because index starts at 0 and we skip header row
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Get MSHS from the row
                $mshs = $row[$mshs_index];
                if (empty($mshs)) {
                    $errors[] = "Dòng {$rowNumber}: Thiếu MSHS, không thể cập nhật";
                    continue;
                }

                // Find the student by MSHS
                $student = Student::where('mshs', $mshs)->first();
                if (!$student) {
                    $errors[] = "Dòng {$rowNumber}: Không tìm thấy học sinh với MSHS {$mshs}";
                    continue;
                }

                // Prepare update data
                $updateData = [];
                foreach ($headers as $colIndex => $header) {
                    // Skip MSHS column for updates
                    if ($header === 'mshs') {
                        continue;
                    }
                    
                    // Only update fields that have values
                    if (isset($row[$colIndex]) && $row[$colIndex] !== '') {
                        $value = $row[$colIndex];
                        
                        // Handle special fields
                        switch ($header) {
                            case 'day_of_birth':
                            case 'day_in':
                            case 'day_out':
                                try {
                                    $updateData[$header] = $this->parseDate($value);
                                } catch (\Exception $e) {
                                    $errors[] = "Dòng {$rowNumber}: Lỗi định dạng ngày tháng ở cột {$header}. Vui lòng sử dụng định dạng DD/MM/YYYY";
                                    continue 2; // Skip this row
                                }
                                break;
                                
                            case 'stay_in':
                            case 'leave_school':
                            case 'fail_grade':
                                $updateData[$header] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                                break;
                                
                            case 'discount':
                                $updateData[$header] = intval($value);
                                break;
                                
                            case 'sur_name':
                            case 'name':
                                $updateData[$header] = $value;
                                // If both sur_name and name are updated, update full_name as well
                                if (
                                    ($header === 'sur_name' && isset($updateData['name'])) ||
                                    ($header === 'name' && isset($updateData['sur_name']))
                                ) {
                                    $sur_name = $header === 'sur_name' ? $value : ($updateData['sur_name'] ?? $student->sur_name);
                                    $name = $header === 'name' ? $value : ($updateData['name'] ?? $student->name);
                                    $updateData['full_name'] = $sur_name . ' ' . $name;
                                }
                                break;
                                
                            default:
                                $updateData[$header] = $value;
                                break;
                        }
                    }
                }

                // If both sur_name and name are updated in the same row
                if (isset($updateData['sur_name']) && isset($updateData['name'])) {
                    $updateData['full_name'] = $updateData['sur_name'] . ' ' . $updateData['name'];
                }

                try {
                    // Update student record if there's data to update
                    if (!empty($updateData)) {
                        $student->update($updateData);
                        $updatedCount++;
                    }
                } catch (\Exception $e) {
                    Log::error('Error updating student: ' . $e->getMessage());
                    $errors[] = "Dòng {$rowNumber}: Lỗi khi cập nhật dữ liệu - " . $e->getMessage();
                }
            }

            // Return response
            if ($updatedCount > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Đã cập nhật thành công {$updatedCount} học sinh",
                    'updated' => $updatedCount,
                    'errors' => $errors
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Không có học sinh nào được cập nhật',
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
