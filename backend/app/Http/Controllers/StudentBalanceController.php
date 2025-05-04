<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class StudentBalanceController extends Controller
{
    /**
     * Get a student's balance
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required|exists:students,mshs',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Mã số học sinh không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        $mshs = $request->input('mshs');
        $balance = StudentBalance::where('mshs', $mshs)->first();

        if (!$balance) {
            // Create a balance record if it doesn't exist
            $balance = StudentBalance::create([
                'mshs' => $mshs,
                'balance' => 0
            ]);
        }

        $student = Student::where('mshs', $mshs)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'mshs' => $mshs,
                'student_name' => $student->full_name,
                'balance' => $balance->balance,
                'class' => $student->class,
                'grade' => $student->grade
            ]
        ]);
    }

    /**
     * Update a student's balance
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mshs' => 'required|exists:students,mshs',
            'amount' => 'required|numeric',
            'operation' => 'required|in:add,subtract,set',
            'note' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        $mshs = $request->input('mshs');
        $amount = $request->input('amount');
        $operation = $request->input('operation');
        $note = $request->input('note');

        try {
            $balance = StudentBalance::where('mshs', $mshs)->first();

            if (!$balance) {
                // Create a balance record if it doesn't exist
                $balance = StudentBalance::create([
                    'mshs' => $mshs,
                    'balance' => 0
                ]);
            }

            $oldBalance = $balance->balance;

            // Update balance based on operation
            switch ($operation) {
                case 'add':
                    $balance->balance += $amount;
                    break;
                case 'subtract':
                    $balance->balance -= $amount;
                    break;
                case 'set':
                    $balance->balance = $amount;
                    break;
            }

            $balance->save();

            // Log the balance change
            Log::info("Student balance updated", [
                'mshs' => $mshs,
                'operation' => $operation,
                'amount' => $amount,
                'old_balance' => $oldBalance,
                'new_balance' => $balance->balance,
                'note' => $note
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật số dư thành công',
                'data' => [
                    'mshs' => $mshs,
                    'old_balance' => $oldBalance,
                    'new_balance' => $balance->balance,
                    'amount' => $amount,
                    'operation' => $operation
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Error updating student balance: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật số dư: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all students with their balances
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllBalances(Request $request)
    {
        try {
            $query = Student::select('students.mshs', 'students.full_name', 'students.grade', 'students.class', 'student_balance.balance')
                ->leftJoin('student_balance', 'students.mshs', '=', 'student_balance.mshs');

            // Apply filters if provided
            if ($request->has('grade')) {
                $query->where('students.grade', $request->input('grade'));
            }

            if ($request->has('class')) {
                $query->where('students.class', $request->input('class'));
            }

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('students.full_name', 'like', "%{$search}%")
                      ->orWhere('students.mshs', 'like', "%{$search}%");
                });
            }

            // Apply sorting
            $sortField = $request->input('sort_by', 'students.mshs');
            $sortDirection = $request->input('sort_direction', 'asc');
            $query->orderBy($sortField, $sortDirection);

            // Pagination
            $perPage = $request->input('per_page', 15);
            $students = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $students
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching student balances: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách số dư: ' . $e->getMessage()
            ], 500);
        }
    }
}