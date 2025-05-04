<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats()
    {
        try {
            // Get total students count
            $totalStudents = Student::count();
            
            // Get total classes count
            $totalClasses = DB::table('classes')->count();
            
            // Get total revenue (sum of all transactions)
            $totalRevenue = Transaction::sum('amount_paid');
            
            // Get outstanding debt
            $outstandingDebt = DB::table('student_balance')
                ->where('balance', '>', 0)
                ->sum('balance');
            
            // Get recent transactions (last 5)
            // Using a safer approach that doesn't rely on the relationship
            $recentTransactions = Transaction::orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($transaction) {
                    // Optionally enrich with student data if needed
                    $student = Student::where('mshs', $transaction->mshs)->first();
                    if ($student) {
                        $transaction->student_data = [
                            'name' => $student->name,
                            'sur_name' => $student->sur_name,
                            'grade' => $student->grade,
                            'class' => $student->class
                        ];
                    }
                    return $transaction;
                });
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'totalStudents' => $totalStudents,
                    'totalClasses' => $totalClasses,
                    'totalRevenue' => $totalRevenue,
                    'outstandingDebt' => $outstandingDebt,
                    'recentTransactions' => $recentTransactions
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
