<?php
namespace App\Http\Controllers;

use App\Models\TuitionMonthlyFeeListing;
use App\Models\TuitionGroup;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Exception;
use Illuminate\Support\Facades\Cache;

class TuitionMonthlyFeeListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tuititionsMothlyFees = TuitionMonthlyFeeListing::all();
        return response()->json([
            'status' => 'success',
            'data' => $tuititionsMothlyFees,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Get current Date and Year in Asia/Bangkok timezone
        $now = now('Asia/Bangkok');
        $currentMonth = (int)$now->format('m');
        $currentYear = (int)$now->format('Y');
        $yearMonth = $now->format('Y-m');

        // Only allow creation on the first day of the month
        if ((int)$now->format('d') !== 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Records can only be created on the first day of the month (UTC+7).'
            ], 403);
        }

        // Prevent duplicate generation
        if (TuitionMonthlyFeeListing::where('year_month', $yearMonth)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Records for this month already exist.'
            ], 409);
        }

        // Ensure partition exists for this month
        $this->ensurePartitionExists($yearMonth);

        $count = $this->dataProcessing($currentMonth, $currentYear, $yearMonth);

        return response()->json([
            'status' => 'success',
            'message' => 'Monthly fee records created successfully.',
            'count' => $count
        ]);
    }

    /**
     * Add a new student to the tuition monthly fee listing for the current month
     * 
     * @param string $mshs Student ID
     * @return \Illuminate\Http\JsonResponse
     */
    public function addNewStudentToTuitionMonthlyGroup($mshs)
    {
        try {
            // Validate MSHS
            if (empty($mshs)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student ID (MSHS) is required.'
                ], 400);
            }

            // Get current Date and Year in Asia/Bangkok timezone
            $now = now('Asia/Bangkok');
            $currentMonth = (int)$now->format('m');
            $currentYear = (int)$now->format('Y');
            $yearMonth = $now->format('Y-m');
            
            // Check if record already exists
            $existingRecord = TuitionMonthlyFeeListing::where('mshs', $mshs)
                ->where('year_month', $yearMonth)
                ->first();
                
            if ($existingRecord) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Student already has a tuition record for this month.',
                    'data' => $existingRecord
                ]);
            }
            
            // Ensure partition exists for this month
            $this->ensurePartitionExists($yearMonth);
            
            // Get tuition groups for the current month with caching
            $tuitionGroups = Cache::remember("tuition_groups_month_{$currentMonth}", now()->addHours(24), function () use ($currentMonth) {
                return TuitionGroup::select('code', 'name', 'default_amount', 'grade', 'group', 'month_apply')
                    ->whereRaw("(',' || month_apply || ',') LIKE '%,$currentMonth,%'")
                    ->get()
                    ->groupBy('grade');
            });

            // Get student data
            $student = Student::where('mshs', $mshs)->first();
            
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found with MSHS: ' . $mshs
                ], 404);
            }

            $student_grade = $student->grade;
            $student_noitru = filter_var($student->stay_in, FILTER_VALIDATE_BOOLEAN);
            $student_discount = $student->discount;
            
            // Get applicable tuitions
            $tuitions = $tuitionGroups->get($student_grade, collect([]))
                ->filter(fn($t) => $student_noitru || $t->group !== 'NT');

            // Calculate phaithu
            $phaithu = $this->calculatePhaithu($tuitions, $student_discount);
            $mahp = implode(',', $tuitions->pluck('code')->toArray());
            
            // Set default values
            $dudau = ['total' => 0, 'details' => []];
            $dathu = ['total' => 0, 'details' => []];
            $duno = $this->calculateDuno($dudau, $phaithu, $dathu);
            $invoiceIds = [];
            
            // Create the record
            $record = new TuitionMonthlyFeeListing([
                'month' => $currentMonth,
                'year' => $currentYear,
                'year_month' => $yearMonth,
                'mshs' => $student->mshs,
                'student_name' => $student->full_name ?? ($student->sur_name . ' ' . $student->name),
                'tuitions' => $mahp,
                'dudau' => $dudau,
                'phaithu' => $phaithu,
                'dathu' => $dathu,
                'duno' => $duno,
                'invoice_ids' => $invoiceIds
            ]);
            
            $record->save();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Student added to tuition monthly fee listing successfully.',
                'data' => $record
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error adding student to tuition monthly fee listing: " . $e->getMessage(), [
                'mshs' => $mshs,
                'exception' => $e
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to add student to tuition monthly fee listing: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reusable data processing for creating monthly fee records.
     * 
     * @param int $month
     * @param int $year
     * @param string $yearMonth
     * @return int Number of records inserted
     */
    private function dataProcessing($month, $year, $yearMonth)
    {
        // Preload tuition groups for the month
        $tuitionGroups = Cache::remember("tuition_groups_month_{$month}", now()->addHours(24), function () use ($month) {
            return TuitionGroup::select('code', 'name', 'default_amount', 'grade', 'group', 'month_apply')
                ->whereRaw("(',' || month_apply || ',') LIKE '%,$month,%'")
                ->get()
                ->groupBy('grade');
        });

        // Preload students
        $students = DB::table('students')
            ->where('grade', '!=', '13')
            ->where('leave_school', false)
            ->get();
            //->where('grade', '!=', '13')
        // Preload invoices and transactions for the given year/month
        $invoices = DB::table('invoices')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->whereIn('mshs', $students->pluck('mshs'))
            ->get()
            ->groupBy('mshs');

        $transactionIds = $invoices->flatMap(function ($invoiceGroup) {
            return $invoiceGroup->flatMap(function ($invoice) {
                return array_filter(explode(',', $invoice->transaction_id ?? ''));
            });
        })->unique();

        $transactions = DB::table('transactions')
            ->whereIn('id', $transactionIds)
            ->get()
            ->groupBy('id');

        // Preload previous month's data
        $lastYearMonth = $month == 1 ? ($year - 1) . '-12' : $year . '-' . str_pad($month - 1, 2, '0', STR_PAD_LEFT);
        $previousFees = TuitionMonthlyFeeListing::where('year_month', $lastYearMonth)
            ->whereIn('mshs', $students->pluck('mshs'))
            ->get()
            ->keyBy('mshs');

        $batchData = [];

        foreach ($students as $student) {
            $student_mshs = $student->mshs;
            $student_grade = $student->grade;
            $student_noitru = filter_var($student->stay_in, FILTER_VALIDATE_BOOLEAN);
            $student_discount = $student->discount;
            // Get applicable tuitions
            $tuitions = $tuitionGroups->get($student_grade, collect([]))
                ->filter(fn($t) => $student_noitru || $t->group !== 'NT');

            // Calculate phaithu
            $phaithu =$this->calculatePhaithu($tuitions,$student_discount);
            $mahp = implode(',', $tuitions->pluck('code')->toArray());
            
            // Calculate dathu
            $dathu = $this->calculateDathu($invoices->get($student_mshs, collect([])), $transactions);

            // Calculate dudau
            $previousFee = $previousFees->get($student_mshs);
            $dudau = $previousFee
                ? $this->normalizeJsonField($previousFee->duno)
                : $this->calculateDetailedDuno($student, 0);

            // Adjust phaithu based on dudau
            // Calculate duno
            $duno = $this->calculateDuno($dudau, $phaithu, $dathu);

            // Get invoice IDs
            $invoiceIds = $invoices->get($student_mshs, collect([]))->pluck('id')->toArray();
          
            $batchData[] = [
                'month' => $month,
                'year' => $year,
                'year_month' => $yearMonth,
                'mshs' => $student_mshs,
                'student_name' => $student->full_name,
                'tuitions' => $mahp,
                'dudau' => json_encode($dudau),
                'phaithu' => json_encode($phaithu),
                'dathu' => json_encode($dathu),
                'duno' => json_encode($duno),
                'invoice_ids' => json_encode($invoiceIds),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        TuitionMonthlyFeeListing::insert($batchData);

        return count($batchData);
    }

    /**
     * Calculate phaithu for a student based on applicable tuitions.
     */
    /**
     * Calculate phaithu for a student based on applicable tuitions.
     */
    private function calculatePhaithu($tuitions, $discount)
    {
        $phaithu = ['total' => 0, 'details' => []];
        
        foreach ($tuitions as $tuition) {
            $amount = $tuition->default_amount;
            
            // Apply discount if applicable (for HP group only)
            if ($tuition->group == "HP" && $discount > 0) {
                $amount = $amount - ($amount * $discount / 100);
            }
            
            // Add to details
            $phaithu['details'][$tuition->code] = $amount;
            
            // Add to total
            $phaithu['total'] += $amount;
        }
        
        return $phaithu;
    }
    /**
     * Calculate dathu based on invoices and transactions.
     */
    private function calculateDathu($invoiceGroup, $transactions)
    {
        $dathu = ['total' => 0, 'details' => []];
        
        foreach ($invoiceGroup as $invoice) {
            $transactionIds = array_filter(explode(',', $invoice->transaction_id ?? ''));
            foreach ($transactionIds as $tid) {
                $transaction = $transactions->get($tid);
                if ($transaction && $transaction->first()) {
                    $transactionItem = $transaction->first();
                    $amount = $transactionItem->amount_paid;
                    if ($amount != 0) { // Only include non-zero amounts
                        $dathu['details'][$transactionItem->paid_code] = ($dathu['details'][$transactionItem->paid_code] ?? 0) + $amount;
                        $dathu['total'] += $amount;
                    }
                }
            }
        }
        
        return $dathu;
    }

    /**
     * Ensure array has the required structure for fee calculations
     */
    private function ensureArrayStructure($array)
    {
        if (!is_array($array)) {
            return ['total' => 0, 'details' => []];
        }
        
        if (!isset($array['total'])) {
            $array['total'] = isset($array['totalamount']) ? $array['totalamount'] : 0;
        }
        
        if (!isset($array['details']) || !is_array($array['details'])) {
            $array['details'] = [];
        }
        
        $array['details'] = array_filter($array['details'], fn($value) => $value != 0);
        
        return $array;
    }
    /**
     * Calculate duno based on dudau, phaithu, and dathu.
     */
    private function calculateDuno($dudau, $phaithu, $dathu)
    {
        $dudau = $this->ensureArrayStructure($dudau, false);
        $phaithu = $this->ensureArrayStructure($phaithu, true);
        $dathu = $this->ensureArrayStructure($dathu, false);

        $duno = ['total' => 0, 'details' => []];

        // Merge all possible keys from dudau, phaithu, and dathu
        $allKeys = array_unique(array_merge(
            array_keys($dudau['details'] ?? []),
            array_keys($phaithu['details'] ?? []),
            array_keys($dathu['details'] ?? [])
        ));

        // Calculate duno for each key
        foreach ($allKeys as $code) {
            $dudauAmount = $dudau['details'][$code] ?? 0;
            $phaithuAmount = $phaithu['details'][$code] ?? 0;
            $dathuAmount = $dathu['details'][$code] ?? 0;

            $dunoAmount = $dudauAmount + $dathuAmount - $phaithuAmount;
            if ($dunoAmount != 0) { // Only include non-zero values
                $duno['details'][$code] = $dunoAmount;
            }
            $duno['total'] += $dunoAmount;
        }

        return $duno;
    }

    /**
     * Normalize JSON field to ensure consistent structure and return as array.
     */
    private function normalizeJsonField($value)
    {
        if (is_numeric($value)) {
            return ['total' => floatval($value), 'details' => []];
        } elseif (is_string($value)) {
            $decoded = json_decode($value, true) ?? ['total' => 0, 'details' => []];
            if (isset($decoded['totalamount']) && !isset($decoded['total'])) {
                $decoded['total'] = $decoded['totalamount'];
                unset($decoded['totalamount']);
            }
            return $decoded;
        } else {
            $result['details'] = array_filter($result['details'] ?? [], fn($value) => $value != 0);
            return $result;
        }
    }

    /**
     * API to generate fee records for a specific month and year (for backfilling old data).
     */
    public function insertByMonthYear(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
        ]);

        $month = (int)$request->input('month');
        $year = (int)$request->input('year');
        $yearMonth = sprintf('%04d-%02d', $year, $month);

        // Prevent duplicate generation
        if (TuitionMonthlyFeeListing::where('year_month', $yearMonth)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Records for this month and year already exist.'
            ], 409);
        }

        // Ensure partition exists for this month
        $this->ensurePartitionExists($yearMonth);

        $count = $this->dataProcessing($month, $year, $yearMonth);

        return response()->json([
            'status' => 'success',
            'message' => 'Monthly fee records created successfully for ' . $yearMonth,
            'count' => $count
        ]);
    }

    /**
     * Ensure a partition exists for the given year_month.
     * Only works for PostgreSQL LIST partitioning.
     */
    private function ensurePartitionExists($yearMonth)
    {
        // Check if partition exists
        $partitionName = 'tuition_monthly_fee_listings_' . str_replace('-', '_', $yearMonth);

        $exists = DB::select("
            SELECT 1 FROM pg_class WHERE relname = ?
        ", [$partitionName]);

        if (empty($exists)) {
            // Create partition for this year_month
            DB::statement("
                CREATE TABLE IF NOT EXISTS {$partitionName} PARTITION OF tuition_monthly_fee_listings
                FOR VALUES IN ('{$yearMonth}');
            ");
        }
    }
    public function importDudauFromExcel(Request $request)
    {
        $request->validate([
            'year_month' => 'required|date_format:Y-m',
        ]);

        $filePath = base_path('database/KTTONG_1.xlsx');
        if (!file_exists($filePath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Excel file not found at ' . $filePath,
            ], 404);
        }

        // Load Excel file
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        // Find column indexes
        $header = $rows[1];
        $mahsCol = array_search('mahs', array_map('strtolower', array_map('trim', $header)));
        $sddkCol = array_search('sddk', array_map('strtolower', array_map('trim', $header)));

        if ($mahsCol === false || $sddkCol === false) {
            return response()->json([
                'status' => 'error',
                'message' => 'Excel file must have columns "mahs" and "sddk".',
            ], 422);
        }

        // Build mahs => sddk map
        $mahsSddkMap = collect(array_slice($rows, 1))
            ->filter(fn($row) => !empty(trim($row[$mahsCol] ?? '')) && isset($row[$sddkCol]))
            ->mapWithKeys(fn($row) => [trim($row[$mahsCol]) => floatval($row[$sddkCol])])
            ->toArray();

        [$year, $month] = explode('-', $request->year_month);
        $year = (int)$year;
        $month = (int)$month;

        // Preload students
        $students = DB::table('students')
            ->whereIn('mshs', array_keys($mahsSddkMap))
            ->get()
            ->keyBy('mshs');

        // Preload tuition groups

        $tuitionGroups = Cache::remember("tuition_groups_month_{$month}", now()->addHours(24), function () use ($month) {
            return TuitionGroup::select('code', 'name', 'default_amount', 'grade', 'group', 'month_apply')
                ->whereRaw("(',' || month_apply || ',') LIKE '%,$month,%'")
                ->get()
                ->groupBy('grade');
        });
        // Preload invoices and transactions
        $invoices = DB::table('invoices')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->whereIn('mshs', array_keys($mahsSddkMap))
            ->get()
            ->groupBy('mshs');

        $transactionIds = $invoices->flatMap(function ($invoiceGroup) {
            return $invoiceGroup->flatMap(function ($invoice) {
                return array_filter(explode(',', $invoice->transaction_id ?? ''));
            });
        })->unique();

        $transactions = DB::table('transactions')
            ->whereIn('id', $transactionIds)
            ->get()
            ->groupBy('id');

        // Preload existing listings
        $listings = TuitionMonthlyFeeListing::where('year_month', $request->year_month)
            ->whereIn('mshs', array_keys($mahsSddkMap))
            ->get()
            ->keyBy('mshs');

        $updated = 0;
        $notFound = [];

        foreach ($mahsSddkMap as $mahs => $sddk) {
            $student = $students->get($mahs);
            if (!$student) {
                $notFound[] = $mahs;
                continue;
            }

            $listing = $listings->get($mahs);
            if (!$listing) {
                $notFound[] = $mahs;
                continue;
            }

            $tuitions = $tuitionGroups->get($student->grade, collect([]))
                ->filter(fn($t) => filter_var($student->stay_in, FILTER_VALIDATE_BOOLEAN) || $t->group !== 'NT');
            $discount = $student->discount;
            $phaithu = $this->calculatePhaithu($tuitions, $discount);
            $mahp = implode(',', $tuitions->pluck('code')->toArray());
            $dathu = $this->calculateDathu($invoices->get($mahs, collect([])), $transactions);
            $dudau = $this->calculateDetailedDuno($student, $sddk);
            $duno = $this->calculateDuno($dudau, $phaithu, $dathu);
            $invoiceIds = $invoices->get($mahs, collect([]))->pluck('id')->toArray();

            $listing->update([
                'tuitions' => $mahp,
                'dudau' => json_encode($dudau),
                'phaithu' => json_encode($phaithu),
                'dathu' => json_encode($dathu),
                'duno' => json_encode($duno),
                'invoice_ids' => json_encode($invoiceIds),
                'updated_at' => now(),
            ]);

            $updated++;
        }

        return response()->json([
            'status' => 'success',
            'updated' => $updated,
            'duno_updated' => $updated,
            'not_found' => $notFound,
            'message' => "Updated $updated records. " . (count($notFound) ? count($notFound) . " mahs not found." : ''),
        ]);
    }
    /**
     * Calculate detailed balance from scratch for a student
     *
     * @param \App\Models\Student $student Student model
     * @param float $balance Total balance amount
     * @return array Detailed balance data
     */
    public function calculateDetailedDuno($student, $balance)
    {
        $currentMonth = intval(date('n'));
        $tuitionGroups = TuitionGroup::where('grade', $student->grade)->get();
        $detailData = [];
        $hpGroup = null;
        $hpCode = null;
        $hpAmount = 0;
        $monthlyFees = 0;

        // Identify HP group and build detailData
        foreach ($tuitionGroups as $group) {
            // Skip NT groups if stay_in is false
            if ($student->stay_in === false && $group->group === "NT") {
                continue;
            }

            // Check if this tuition applies to the current month
            $monthApply = $group->month_apply;
            if (!$monthApply) continue;

            $monthApplyArray = strpos($monthApply, ',') > 0 ? explode(",", $monthApply) : [$monthApply];
            if (in_array($currentMonth, $monthApplyArray)) {
                $amount = $group->default_amount;

                // Apply discount if applicable
                if (strpos($group->grade, "HP") > -1) {
                    $amountWithDiscount = $amount - ($amount * $student->discount / 100);
                } else {
                    $amountWithDiscount = $amount;
                }

                $detailData[$group->code] = 0; // Initialize with zero
                $monthlyFees += $amountWithDiscount;

                // Save HP group info
                if ($group->group === "HP") {
                    $hpGroup = $group;
                    $hpCode = $group->code;
                    $hpAmount = $amountWithDiscount;
                }
            }
        }

        // If HP group exists and balance < HP, prioritize HP
        if ($hpGroup && $balance > 0 && $balance < $hpAmount) {
            foreach ($detailData as $code => $_) {
                $detailData[$code] = 0;
            }
            $detailData[$hpCode] = $balance;
        } elseif ($balance > 0 && $monthlyFees > 0) {
            // Distribute balance across months
            $advanceMonths = floor($balance / $monthlyFees);
            $remainingBalance = $balance - ($advanceMonths * $monthlyFees);

            // Distribute for full months
            foreach ($detailData as $code => $amount) {
                $tuitionGroup = $tuitionGroups->firstWhere('code', $code);
                if ($tuitionGroup) {
                    $tuitionAmount = $tuitionGroup->default_amount;

                    // Apply discount if applicable
                    if (strpos($tuitionGroup->grade, "HP") > -1) {
                        $tuitionAmount = $tuitionAmount - ($tuitionAmount * $student->discount / 100);
                    }

                    $detailData[$code] = $advanceMonths * $tuitionAmount;
                }
            }

            // Distribute remaining balance
            if ($hpGroup && $remainingBalance > 0 && $remainingBalance < $hpAmount) {
                // If remaining balance is less than HP, assign to HP
                $detailData[$hpCode] += $remainingBalance;
            } elseif ($remainingBalance > 0) {
                // Distribute remaining balance proportionally
                foreach ($detailData as $code => $amount) {
                    $tuitionGroup = $tuitionGroups->firstWhere('code', $code);
                    if ($tuitionGroup) {
                        $tuitionAmount = $tuitionGroup->default_amount;
                        if (strpos($tuitionGroup->grade, "HP") > -1) {
                            $tuitionAmount = $tuitionAmount - ($tuitionAmount * $student->discount / 100);
                        }
                        $proportion = $monthlyFees ? ($tuitionAmount / $monthlyFees) : 0;
                        $detailData[$code] += $remainingBalance * $proportion; // No rounding
                    }
                }
            }
        }

        // Remove zero values
        $detailData = array_filter($detailData, fn($value) => $value != 0);

        return [
            'details' => $detailData,
            'totalamount' => $balance,
        ];
    }
    /**
     * Get tuition monthly fee listings by student MSHS - Optimized for speed
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByMshs(Request $request)
    {
        $request->validate([
            'mshs' => 'required|string',
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2000|max:2100',
            'action' => 'nullable|string',
        ]);

        $mshs = $request->input('mshs');
        $action = $request->input('action');
        $now = now('Asia/Bangkok');
        $month = $request->input('month', (int)$now->format('m'));
        $year = $request->input('year', (int)$now->format('Y'));
        $yearMonth = sprintf('%04d-%02d', $year, $month);

        try {
            // 1. Fetch tuition listing - this is the main query that needs optimization
            $tuitionListing = TuitionMonthlyFeeListing::select([
                    'mshs', 'student_name', 'tuitions', 
                    'dudau', 'phaithu', 'dathu', 'duno', 'invoice_ids'
                ])
                ->where('mshs', $mshs)
                ->where('year_month', $yearMonth)
                ->first();

            // 2. If not found and action is not 'modal', return early
            if (!$tuitionListing && $action !== 'modal') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No tuition data found for this student and month.',
                ], 404);
            }

            $newInvoiceId = null;

            // 3. Create invoice if needed (action === 'modal')
            if ($action === 'modal') {
                // Use a direct query with index on year_month
                $totalInvoices = DB::table('invoices')
                    ->where('year_month', $yearMonth)
                    ->count();
                    
                $newInvoiceId = sprintf('%04d/%d', $totalInvoices + 1, $month);

                // Insert new invoice
                DB::table('invoices')->insert([
                    'invoice_id' => $newInvoiceId,
                    'mshs' => $mshs,
                    'year_month' => $yearMonth,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Re-fetch if needed
                if (!$tuitionListing) {
                    $tuitionListing = TuitionMonthlyFeeListing::select([
                            'mshs', 'student_name', 'tuitions', 
                            'dudau', 'phaithu', 'dathu', 'duno', 'invoice_ids'
                        ])
                        ->where('mshs', $mshs)
                        ->where('year_month', $yearMonth)
                        ->first();

                    if (!$tuitionListing) {
                        throw new \Exception('No tuition data found for this student and month after attempting invoice creation.');
                    }
                }
            }
            
            // 4. Get fee data (already arrays from model casting)
            $phaithu = $tuitionListing->phaithu;
            $dudau = $tuitionListing->dudau;
            $dathu = $tuitionListing->dathu;
            $duno = $tuitionListing->duno;
            $invoiceIds = $tuitionListing->invoice_ids ?? [];

            // 5. Get tuition details with optimized caching
            $tuitionCodes = array_keys($phaithu['details'] ?? []);
            $tuitionDetails = [];
            $tuitionDetailsArr = [];

            if (!empty($tuitionCodes)) {
                // Use a longer cache duration (24 hours)
                $cacheKey = "tuition_groups_codes_" . md5(implode(',', $tuitionCodes));
                $tuitionGroups = Cache::remember($cacheKey, now()->addDay(), function () use ($tuitionCodes) {
                    return TuitionGroup::select('code', 'name', 'default_amount', 'group')
                        ->whereIn('code', $tuitionCodes)
                        ->get()
                        ->keyBy('code');
                });

                foreach ($tuitionGroups as $code => $tuition) {
                    $tuitionDetails[$code] = [
                        'name' => $tuition->name,
                        'default_amount' => $tuition->default_amount,
                        'group' => $tuition->group,
                    ];
                    $tuitionDetailsArr[] = [
                        'code' => $code,
                        'name' => $tuition->name,
                    ];
                }
            }

            // 6. Process fees efficiently
            $processedFees = [];
            foreach ($phaithu['details'] ?? [] as $code => $amount) {
                if ($tuitionInfo = $tuitionDetails[$code] ?? null) {
                    $processedFees[] = [
                        'code' => $code,
                        'name' => $tuitionInfo['name'],
                        'default_amount' => $tuitionInfo['default_amount'],
                        'suggested_payment' => (float)$amount,
                        'groupcode' => $tuitionInfo['group'],
                        'opening_debt_balance' => (float)($dudau['details'][$code] ?? 0),
                        'total_paid_amount' => (float)($dathu['details'][$code] ?? 0),
                        'remaining_amount' => (float)($duno['details'][$code] ?? 0),
                        'isChecked' => true,
                        'isAmountModified' => false,
                    ];
                }
            }
            // Sort the fees with HP items first
            usort($processedFees, function($a, $b) {
                // Check if item code contains 'HP'
                $aIsHP = strpos($a['code'], 'HP') !== false;
                $bIsHP = strpos($b['code'], 'HP') !== false;
                
                // HP items come first
                if ($aIsHP && !$bIsHP) return -1;
                if (!$aIsHP && $bIsHP) return 1;
                
                // If both are HP or both are not HP, maintain original order
                return 0;
            });
            // 7. Build response data
            // IMPORTANT: If your frontend expects full arrays, change these to return full arrays
            $responseData = [
                'mshs' => $tuitionListing->mshs,
                'student_name' => $tuitionListing->student_name,
                'tuitions' => $tuitionDetailsArr,
                'dudau' => $dudau,    
                'phaithu' => $phaithu,
                'dathu' => $dathu,       
                'duno' => $duno,      
                'processedFees' => $processedFees,
            ];

            // 8. Update invoice_ids if needed
            if ($newInvoiceId) {
                $responseData['invoice_id'] = $newInvoiceId;
                
                // Update the invoice_ids in the database
                $currentInvoiceIds = is_array($invoiceIds) ? $invoiceIds : [];
                if (!in_array($newInvoiceId, $currentInvoiceIds)) {
                    $currentInvoiceIds[] = $newInvoiceId;
                    $tuitionListing->invoice_ids = $currentInvoiceIds;
                    $tuitionListing->save();
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $responseData,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error in getByMshs for MSHS {$mshs}: " . $e->getMessage(), ['exception' => $e]);
            
            $statusCode = ($e->getMessage() === 'No tuition data found for this student and month after attempting invoice creation.' ||
                        $e->getMessage() === 'No tuition data found for this student and month.') 
                        ? 404 
                        : 500;
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve tuition data: ' . $e->getMessage(),
            ], $statusCode);
        }
    }
    /**
     * Helper to sanitize fee data arrays (after model casting).
     * Ensures 'total' and 'details' keys exist and details are numeric.
     */
    private function sanitizeFeeDataArray($feeData)
    {
        if (!is_array($feeData)) {
            // This should ideally not happen if model casting is effective
            // and database stores valid JSON or NULL.
            return ['total' => 0, 'details' => []];
        }

        $details = $feeData['details'] ?? [];
        // Ensure details are numeric and filter out zero values
        $numericDetails = [];
        if (is_array($details)) {
            foreach ($details as $key => $value) {
                if (is_numeric($value) && $value != 0) {
                    $numericDetails[$key] = (float)$value;
                }
            }
        }
        
        $total = 0;
        // Prioritize 'total' key, then 'totalamount' (legacy), then sum of numeric details
        if (isset($feeData['total']) && is_numeric($feeData['total'])) {
            $total = (float)$feeData['total'];
        } elseif (isset($feeData['totalamount']) && is_numeric($feeData['totalamount'])) { // Legacy support
            $total = (float)$feeData['totalamount'];
        } else {
            $total = array_sum($numericDetails);
        }

        return ['total' => $total, 'details' => $numericDetails];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
