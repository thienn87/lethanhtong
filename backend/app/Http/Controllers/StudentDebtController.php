<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\Log;

class StudentDebtController extends Controller
{
    /**
     * Search for student debts with filtering, pagination, and sorting
     */
    public function search(Request $request)
    {
        try {
            // Get request parameters
            $keyword = $request->input('keyword', '');
            $grade = $request->input('grade', '');
            $class = $request->input('class', '');
            $year = $request->input('year', date('Y'));
            $month = $request->input('month', date('m'));
            $page = max(1, intval($request->input('page', 1)));
            $limit = max(10, min(100, intval($request->input('limit', 50))));
            $offset = ($page - 1) * $limit;
            
            // Get sorting parameters
            $sortBy = $request->input('sort_by', '');
            $sortDirection = strtolower($request->input('sort_direction', 'asc')) === 'desc' ? 'DESC' : 'ASC';
            
            // Validate sort field
            $allowedSortFields = [
                'du_cuoi_thang_truoc',
                'dathu',
                'du_cuoi_thang_nay',
                'tong_du_cuoi'
            ];
            
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = ''; // Reset if invalid
            }
            
            // Format year-month
            $yearMonth = sprintf('%04d-%02d', $year, $month);
            
            // Build the base query with PostgreSQL JSON functions
            $query = DB::table('tuition_monthly_fee_listings as tmfl')
                ->join('students as s', 's.mshs', '=', 'tmfl.mshs')
                ->select(
                    's.mshs',
                    's.full_name as ten',
                    's.grade as khoi',
                    's.class as lop',
                    DB::raw("COALESCE((tmfl.dudau::jsonb->>'total')::numeric, 0) as du_cuoi_thang_truoc"),
                    DB::raw("COALESCE((tmfl.dathu::jsonb->>'total')::numeric, 0) as dathu"),
                    DB::raw("COALESCE((tmfl.duno::jsonb->>'total')::numeric, 0) as du_cuoi_thang_nay")
                )
                ->where('tmfl.year_month', $yearMonth)
                ->where('s.leave_school', 'false');
            
            // Apply filters
            if (!empty($keyword)) {
                $query->where(function($q) use ($keyword) {
                    $q->where('s.mshs', 'like', "%{$keyword}%")
                    ->orWhere('s.full_name', 'like', "%{$keyword}%");
                });
            }
            
            if (!empty($grade)) {
                $query->where('s.grade', $grade);
            }
            
            if (!empty($class)) {
                $query->where('s.class', $class);
            }
            
            // Get total count for pagination
            $totalCount = $query->count();
            $totalPages = ceil($totalCount / $limit);
            
            // Apply sorting if specified
            if (!empty($sortBy)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                // Default sorting
                $query->orderBy('s.grade', 'ASC')
                    ->orderBy('s.class', 'ASC')
                    ->orderBy('s.full_name', 'ASC');
            }
            
            // Check if export is requested
            if ($request->has('export') && $request->input('export') === 'true') {
                return $this->exportToExcel($query, $yearMonth);
            }
            
            // Apply pagination
            $students = $query->offset($offset)->limit($limit)->get();
            
            // Get the latest month's duno for each student
            $latestDunoQuery = DB::table('tuition_monthly_fee_listings as t1')
                ->join(DB::raw('(
                    SELECT mshs, MAX(year_month) as latest_year_month
                    FROM tuition_monthly_fee_listings
                    GROUP BY mshs
                ) as t2'), function($join) {
                    $join->on('t1.mshs', '=', 't2.mshs')
                        ->on('t1.year_month', '=', 't2.latest_year_month');
                })
                ->select(
                    't1.mshs',
                    DB::raw("COALESCE((t1.duno::jsonb->>'total')::numeric, 0) as latest_duno")
                );
                
            // Apply the same filters to the latest duno query
            if (!empty($keyword) || !empty($grade) || !empty($class)) {
                $latestDunoQuery->join('students as s', 's.mshs', '=', 't1.mshs');
                
                if (!empty($keyword)) {
                    $latestDunoQuery->where(function($q) use ($keyword) {
                        $q->where('s.mshs', 'like', "%{$keyword}%")
                        ->orWhere('s.full_name', 'like', "%{$keyword}%");
                    });
                }
                
                if (!empty($grade)) {
                    $latestDunoQuery->where('s.grade', $grade);
                }
                
                if (!empty($class)) {
                    $latestDunoQuery->where('s.class', $class);
                }
                
                $latestDunoQuery->where('s.leave_school', 'false');
            }
            
            $latestDunoResults = $latestDunoQuery->get()->keyBy('mshs');
            
            // Add the latest duno to each student record
            foreach ($students as $student) {
                $latestDuno = $latestDunoResults->get($student->mshs);
                $student->tong_du_cuoi = $latestDuno ? $latestDuno->latest_duno : 0;
            }
            
            // Calculate totals
            $totals = [
                'du_cuoi_thang_truoc' => 0,
                'dathu' => 0,
                'du_cuoi_thang_nay' => 0,
                'tong_du_cuoi' => 0
            ];
            
            // Get totals from all records (not just the paginated ones)
            $totalsQuery = DB::table('tuition_monthly_fee_listings as tmfl')
                ->join('students as s', 's.mshs', '=', 'tmfl.mshs')
                ->select(
                    DB::raw("SUM(COALESCE((tmfl.dudau::jsonb->>'total')::numeric, 0)) as du_cuoi_thang_truoc"),
                    DB::raw("SUM(COALESCE((tmfl.dathu::jsonb->>'total')::numeric, 0)) as dathu"),
                    DB::raw("SUM(COALESCE((tmfl.duno::jsonb->>'total')::numeric, 0)) as du_cuoi_thang_nay")
                )
                ->where('tmfl.year_month', $yearMonth)
                ->where('s.leave_school', 'false');
            
            // Apply the same filters to the totals query
            if (!empty($keyword)) {
                $totalsQuery->where(function($q) use ($keyword) {
                    $q->where('s.mshs', 'like', "%{$keyword}%")
                    ->orWhere('s.full_name', 'like', "%{$keyword}%");
                });
            }
            
            if (!empty($grade)) {
                $totalsQuery->where('s.grade', $grade);
            }
            
            if (!empty($class)) {
                $totalsQuery->where('s.class', $class);
            }
            
            $totalsResult = $totalsQuery->first();
            
            if ($totalsResult) {
                $totals = [
                    'du_cuoi_thang_truoc' => $totalsResult->du_cuoi_thang_truoc ?? 0,
                    'dathu' => $totalsResult->dathu ?? 0,
                    'du_cuoi_thang_nay' => $totalsResult->du_cuoi_thang_nay ?? 0
                ];
                
                // Calculate tong_du_cuoi as the sum of latest duno values
                $latestDunoSum = DB::table('tuition_monthly_fee_listings as t1')
                    ->join(DB::raw('(
                        SELECT mshs, MAX(year_month) as latest_year_month
                        FROM tuition_monthly_fee_listings
                        GROUP BY mshs
                    ) as t2'), function($join) {
                        $join->on('t1.mshs', '=', 't2.mshs')
                            ->on('t1.year_month', '=', 't2.latest_year_month');
                    })
                    ->join('students as s', 's.mshs', '=', 't1.mshs')
                    ->where('s.leave_school', 'false');
                    
                // Apply the same filters to the latest duno sum query
                if (!empty($keyword)) {
                    $latestDunoSum->where(function($q) use ($keyword) {
                        $q->where('s.mshs', 'like', "%{$keyword}%")
                        ->orWhere('s.full_name', 'like', "%{$keyword}%");
                    });
                }
                
                if (!empty($grade)) {
                    $latestDunoSum->where('s.grade', $grade);
                }
                
                if (!empty($class)) {
                    $latestDunoSum->where('s.class', $class);
                }
                
                $latestDunoTotal = $latestDunoSum->sum(DB::raw("COALESCE((t1.duno::jsonb->>'total')::numeric, 0)"));
                $totals['tong_du_cuoi'] = $latestDunoTotal;
            }
            
            return response()->json([
                'success' => true,
                'data' => $students,
                'totalCount' => $totalCount,
                'totalPages' => $totalPages,
                'currentPage' => $page,
                'totals' => $totals
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in student debt search: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving student debts: ' . $e->getMessage()
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
     * Export student debts to Excel
     */
    private function exportToExcel($query, $yearMonth)
    {
        try {
            // Get all records for export (no pagination)
            $students = $query->get();
            
            // Create new Spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Set headers
            $sheet->setCellValue('A1', 'MSHS');
            $sheet->setCellValue('B1', 'Họ và tên');
            $sheet->setCellValue('C1', 'Khối');
            $sheet->setCellValue('D1', 'Lớp');
            $sheet->setCellValue('E1', 'Dư cuối tháng trước');
            $sheet->setCellValue('F1', 'Đã thu');
            $sheet->setCellValue('G1', 'Dư cuối tháng này');
            $sheet->setCellValue('H1', 'Tổng dư cuối');
            
            // Style headers
            $headerStyle = [
                'font' => [
                    'bold' => true,
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'E0E0E0',
                    ],
                ],
            ];
            
            $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);
            
            // Add data
            $row = 2;
            foreach ($students as $student) {
                $sheet->setCellValue('A' . $row, $student->mshs);
                $sheet->setCellValue('B' . $row, $student->ten);
                $sheet->setCellValue('C' . $row, $student->khoi);
                $sheet->setCellValue('D' . $row, $student->lop);
                $sheet->setCellValue('E' . $row, $student->du_cuoi_thang_truoc);
                $sheet->setCellValue('F' . $row, $student->dathu);
                $sheet->setCellValue('G' . $row, $student->du_cuoi_thang_nay);
                $sheet->setCellValue('H' . $row, $student->tong_du_cuoi);
                
                // Format numbers
                $sheet->getStyle('E' . $row . ':H' . $row)->getNumberFormat()
                    ->setFormatCode('#,##0');
                
                $row++;
            }
            
            // Add totals row
            $sheet->setCellValue('A' . $row, 'TỔNG');
            $sheet->setCellValue('E' . $row, '=SUM(E2:E' . ($row - 1) . ')');
            $sheet->setCellValue('F' . $row, '=SUM(F2:F' . ($row - 1) . ')');
            $sheet->setCellValue('G' . $row, '=SUM(G2:G' . ($row - 1) . ')');
            $sheet->setCellValue('H' . $row, '=SUM(H2:H' . ($row - 1) . ')');
            
            // Style totals row
            $totalStyle = [
                'font' => [
                    'bold' => true,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'F0F0F0',
                    ],
                ],
            ];
            
            $sheet->getStyle('A' . $row . ':H' . $row)->applyFromArray($totalStyle);
            $sheet->getStyle('E' . $row . ':H' . $row)->getNumberFormat()
                ->setFormatCode('#,##0');
            
            // Auto-size columns
            foreach (range('A', 'H') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Create response with Excel file
            $writer = new Xlsx($spreadsheet);
            $filename = 'student_debts_' . $yearMonth . '.xlsx';
            
            // Save to temp file
            $tempFile = tempnam(sys_get_temp_dir(), 'excel');
            $writer->save($tempFile);
            
            // Return file as download
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Error exporting student debts to Excel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error exporting to Excel: ' . $e->getMessage()
            ], 500);
        }
    }
}