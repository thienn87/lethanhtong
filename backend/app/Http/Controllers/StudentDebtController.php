<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;

class StudentDebtController extends Controller
{
    /**
     * Search for student debts with filtering and pagination
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            // Get parameters from request
            $keyword = $request->input('keyword', '');
            $grade = $request->input('grade', '');
            $class = $request->input('class', '');
            $year = $request->input('year', date('Y'));
            $month = $request->input('month', date('m'));
            $page = $request->input('page', 1);
            $limit = $request->input('limit', 50);
            $exportExcel = $request->input('export', false);
            
            // Format year_month for querying
            $yearMonth = sprintf('%04d-%02d', $year, $month);
            
            // Calculate offset for pagination
            $offset = ($page - 1) * $limit;
            
            // Build the base query
            $query = DB::table('students')
                ->select(
                    'students.mshs',
                    'students.name',
                    'students.sur_name',
                    'students.grade',
                    'students.class',
                    DB::raw('COALESCE(dudau.total, 0) as du_cuoi_thang_truoc'),
                    DB::raw('COALESCE(dathu.total, 0) as dathu'),
                    DB::raw('COALESCE(duno_current.total, 0) as du_cuoi_thang_nay'),
                    DB::raw('COALESCE(duno_latest.total, 0) as tong_du_cuoi')
                )
                ->leftJoin(DB::raw("(
                    SELECT mshs, (dudau->>'total')::numeric as total
                    FROM tuition_monthly_fee_listings
                    WHERE year_month = '{$yearMonth}'
                ) as dudau"), 'students.mshs', '=', 'dudau.mshs')
                ->leftJoin(DB::raw("(
                    SELECT mshs, (dathu->>'total')::numeric as total
                    FROM tuition_monthly_fee_listings
                    WHERE year_month = '{$yearMonth}'
                ) as dathu"), 'students.mshs', '=', 'dathu.mshs')
                ->leftJoin(DB::raw("(
                    SELECT mshs, (duno->>'total')::numeric as total
                    FROM tuition_monthly_fee_listings
                    WHERE year_month = '{$yearMonth}'
                ) as duno_current"), 'students.mshs', '=', 'duno_current.mshs')
                ->leftJoin(DB::raw("(
                    SELECT t1.mshs, (t1.duno->>'total')::numeric as total
                    FROM tuition_monthly_fee_listings t1
                    INNER JOIN (
                        SELECT mshs, MAX(year_month) as max_yearmonth
                        FROM tuition_monthly_fee_listings
                        GROUP BY mshs
                    ) t2 ON t1.mshs = t2.mshs AND t1.year_month = t2.max_yearmonth
                ) as duno_latest"), 'students.mshs', '=', 'duno_latest.mshs')
                ->where('students.leave_school', 'false')
                ->where('students.grade', '!=', 'LT');
            
            // Apply filters
            if (!empty($keyword)) {
                $query->where(function($q) use ($keyword) {
                    $q->where('students.mshs', 'like', "%{$keyword}%")
                      ->orWhere('students.name', 'like', "%{$keyword}%")
                      ->orWhere('students.sur_name', 'like', "%{$keyword}%");
                });
            }
            
            if (!empty($grade)) {
                $query->where('students.grade', $grade);
            }
            
            if (!empty($class)) {
                $query->where('students.class', $class);
            }
            
            // Get total count for pagination
            $totalCount = $query->count();
            $totalPages = ceil($totalCount / $limit);
            
            // Get paginated results
            $students = $query->orderBy('students.grade')
                             ->orderBy('students.class')
                             ->orderBy('students.name')
                             ->offset($offset)
                             ->limit($limit)
                             ->get();
            
            // Format student data
            $formattedStudents = $students->map(function($student) {
                return [
                    'mshs' => $student->mshs,
                    'ten' => $student->sur_name . ' ' . $student->name,
                    'khoi' => $student->grade,
                    'lop' => $student->class,
                    'du_cuoi_thang_truoc' => $student->du_cuoi_thang_truoc,
                    'dathu' => $student->dathu,
                    'du_cuoi_thang_nay' => $student->du_cuoi_thang_nay,
                    'tong_du_cuoi' => $student->tong_du_cuoi
                ];
            });
            
            // Calculate totals
            $totals = [
                'du_cuoi_thang_truoc' => $students->sum('du_cuoi_thang_truoc'),
                'dathu' => $students->sum('dathu'),
                'du_cuoi_thang_nay' => $students->sum('du_cuoi_thang_nay'),
                'tong_du_cuoi' => $students->sum('tong_du_cuoi')
            ];
            
            // Export to Excel if requested
            if ($exportExcel) {
                return $this->exportToExcel($formattedStudents, $totals, $year, $month);
            }
            
            // Return JSON response
            return response()->json([
                'success' => true,
                'data' => $formattedStudents,
                'totals' => $totals,
                'totalCount' => $totalCount,
                'totalPages' => $totalPages,
                'currentPage' => $page,
                'year' => $year,
                'month' => $month
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search student debts: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get details for a specific student
     * 
     * @param Request $request
     * @param string $mshs
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudentDetails(Request $request, $mshs)
    {
        try {
            $year = $request->input('year', date('Y'));
            $month = $request->input('month', date('m'));
            $yearMonth = sprintf('%04d-%02d', $year, $month);
            
            // Get student basic info
            $student = DB::table('students')
                ->where('mshs', $mshs)
                ->first();
                
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }
            
            // Get fee details
            $feeData = DB::table('tuition_monthly_fee_listings')
                ->where('mshs', $mshs)
                ->where('year_month', $yearMonth)
                ->first();
                
            // Get latest duno data
            $latestData = DB::table('tuition_monthly_fee_listings')
                ->where('mshs', $mshs)
                ->orderBy('year_month', 'desc')
                ->first();
                
            // Format response
            $response = [
                'mshs' => $student->mshs,
                'name' => $student->sur_name . ' ' . $student->name,
                'grade' => $student->grade,
                'class' => $student->class,
                'du_cuoi_thang_truoc' => $feeData && isset($feeData->dudau) ? json_decode($feeData->dudau)->total : 0,
                'dathu' => $feeData && isset($feeData->dathu) ? json_decode($feeData->dathu)->total : 0,
                'du_cuoi_thang_nay' => $feeData && isset($feeData->duno) ? json_decode($feeData->duno)->total : 0,
                'tong_du_cuoi' => $latestData && isset($latestData->duno) ? json_decode($latestData->duno)->total : 0,
                'details' => [
                    'du_cuoi_thang_truoc' => $feeData && isset($feeData->dudau) ? json_decode($feeData->dudau)->details : new \stdClass(),
                    'dathu' => $feeData && isset($feeData->dathu) ? json_decode($feeData->dathu)->details : new \stdClass(),
                    'du_cuoi_thang_nay' => $feeData && isset($feeData->duno) ? json_decode($feeData->duno)->details : new \stdClass(),
                    'tong_du_cuoi' => $latestData && isset($latestData->duno) ? json_decode($latestData->duno)->details : new \stdClass()
                ]
            ];
            
            return response()->json([
                'success' => true,
                'data' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get student details: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export student debt data to Excel
     * 
     * @param array $students
     * @param array $totals
     * @param int $year
     * @param int $month
     * @return \Illuminate\Http\Response
     */
    private function exportToExcel($students, $totals, $year, $month)
    {
        // Create new Spreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(15); // MSHS
        $sheet->getColumnDimension('B')->setWidth(30); // Họ và tên
        $sheet->getColumnDimension('C')->setWidth(10); // Khối
        $sheet->getColumnDimension('D')->setWidth(10); // Lớp
        $sheet->getColumnDimension('E')->setWidth(20); // Dư cuối tháng trước
        $sheet->getColumnDimension('F')->setWidth(20); // Đã thu
        $sheet->getColumnDimension('G')->setWidth(20); // Dư cuối tháng này
        $sheet->getColumnDimension('H')->setWidth(20); // Tổng dư cuối
        
        // Set title
        $sheet->setCellValue('A1', 'DANH SÁCH CÔNG NỢ HỌC SINH');
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Set subtitle with month and year
        $sheet->setCellValue('A2', "Tháng {$month} năm {$year}");
        $sheet->mergeCells('A2:H2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Set headers
        $headers = [
            'A4' => 'MSHS',
            'B4' => 'Họ và tên',
            'C4' => 'Khối',
            'D4' => 'Lớp',
            'E4' => 'Dư cuối tháng trước',
            'F4' => 'Đã thu',
            'G4' => 'Dư cuối tháng này',
            'H4' => 'Tổng dư cuối'
        ];
        
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        
        // Style headers
        $headerStyle = [
            'font' => [
                'bold' => true,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => [
                    'rgb' => 'D9D9D9', // Light gray
                ],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];
        
        $sheet->getStyle('A4:H4')->applyFromArray($headerStyle);
        
        // Add data
        $row = 5;
        foreach ($students as $student) {
            $sheet->setCellValue('A' . $row, $student['mshs']);
            $sheet->setCellValue('B' . $row, $student['ten']);
            $sheet->setCellValue('C' . $row, $student['khoi']);
            $sheet->setCellValue('D' . $row, $student['lop']);
            $sheet->setCellValue('E' . $row, $student['du_cuoi_thang_truoc']);
            $sheet->setCellValue('F' . $row, $student['dathu']);
            $sheet->setCellValue('G' . $row, $student['du_cuoi_thang_nay']);
            $sheet->setCellValue('H' . $row, $student['tong_du_cuoi']);
            
            // Format numbers
            $sheet->getStyle('E' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('G' . $row)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
            
            // Color negative numbers red, positive green
            if ($student['du_cuoi_thang_truoc'] < 0) {
                $sheet->getStyle('E' . $row)->getFont()->getColor()->setRGB('FF0000');
            } else if ($student['du_cuoi_thang_truoc'] > 0) {
                $sheet->getStyle('E' . $row)->getFont()->getColor()->setRGB('008000');
            }
            
            if ($student['dathu'] < 0) {
                $sheet->getStyle('F' . $row)->getFont()->getColor()->setRGB('FF0000');
            } else if ($student['dathu'] > 0) {
                $sheet->getStyle('F' . $row)->getFont()->getColor()->setRGB('008000');
            }
            
            if ($student['du_cuoi_thang_nay'] < 0) {
                $sheet->getStyle('G' . $row)->getFont()->getColor()->setRGB('FF0000');
            } else if ($student['du_cuoi_thang_nay'] > 0) {
                $sheet->getStyle('G' . $row)->getFont()->getColor()->setRGB('008000');
            }
            
            if ($student['tong_du_cuoi'] < 0) {
                $sheet->getStyle('H' . $row)->getFont()->getColor()->setRGB('FF0000');
            } else if ($student['tong_du_cuoi'] > 0) {
                $sheet->getStyle('H' . $row)->getFont()->getColor()->setRGB('008000');
            }
            
            $row++;
        }
        
        // Add borders to data cells
        $dataBorderStyle = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        
        $sheet->getStyle('A5:H' . ($row - 1))->applyFromArray($dataBorderStyle);
        
        // Add total row
        $sheet->setCellValue('A' . $row, 'TỔNG CỘNG');
        $sheet->mergeCells('A' . $row . ':D' . $row);
        $sheet->setCellValue('E' . $row, $totals['du_cuoi_thang_truoc']);
        $sheet->setCellValue('F' . $row, $totals['dathu']);
        $sheet->setCellValue('G' . $row, $totals['du_cuoi_thang_nay']);
        $sheet->setCellValue('H' . $row, $totals['tong_du_cuoi']);
        
        // Format total row
        $totalRowStyle = [
            'font' => [
                'bold' => true,
                'size' => 14,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => [
                    'rgb' => 'FFEB9C', // Light yellow
                ],
            ],
            'borders' => [
                'outline' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                ],
            ],
        ];
        
        $sheet->getStyle('A' . $row . ':H' . $row)->applyFromArray($totalRowStyle);
        $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Format total numbers
        $sheet->getStyle('E' . $row)->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('G' . $row)->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('H' . $row)->getNumberFormat()->setFormatCode('#,##0');
        
        // Color total numbers
        if ($totals['du_cuoi_thang_truoc'] < 0) {
            $sheet->getStyle('E' . $row)->getFont()->getColor()->setRGB('FF0000');
        }
        
        if ($totals['dathu'] < 0) {
            $sheet->getStyle('F' . $row)->getFont()->getColor()->setRGB('FF0000');
        }
        
        if ($totals['du_cuoi_thang_nay'] < 0) {
            $sheet->getStyle('G' . $row)->getFont()->getColor()->setRGB('FF0000');
        }
        
        if ($totals['tong_du_cuoi'] < 0) {
            $sheet->getStyle('H' . $row)->getFont()->getColor()->setRGB('FF0000');
        }
        
        // Create file
        $writer = new Xlsx($spreadsheet);
        $filename = "student_debts_{$month}_{$year}_" . date('Y-m-d') . ".xlsx";
        $tempPath = storage_path('app/public/' . $filename);
        $writer->save($tempPath);
        
        // Return file for download
        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}