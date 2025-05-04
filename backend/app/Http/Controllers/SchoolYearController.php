<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use App\Models\Student;
use App\Models\Invoice;
use App\Models\Transaction;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolYearController extends Controller
{
    /**
     * Create a new school year with student promotion and data backup
     *
     * @param Request $request
     * @return StreamedResponse
     */
    public function createNewSchoolYear(Request $request)
    {
        // Get the clearTransactions parameter
        $clearTransactions = $request->query('clearTransactions', 'false') === 'true';
        
        // Create a streamed response for SSE
        $response = new StreamedResponse(function () use ($clearTransactions) {
            // Set headers for SSE
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no'); // For NGINX
            
            // Send start event
            echo "event: start\n";
            echo "data: " . json_encode([
                'message' => 'Bắt đầu tạo năm học mới',
                'timestamp' => now()->toIso8601String()
            ]) . "\n\n";
            flush();
            
            // Step 1: Backup data
            $this->backupData(function ($message, $progress) {
                echo "event: backup\n";
                echo "data: " . json_encode([
                    'message' => $message,
                    'progress' => $progress,
                    'timestamp' => now()->toIso8601String()
                ]) . "\n\n";
                flush();
            });
            
            // Step 2: Promote students
            $this->promoteStudents(function ($message, $progress) {
                echo "event: promotion\n";
                echo "data: " . json_encode([
                    'message' => $message,
                    'progress' => $progress,
                    'timestamp' => now()->toIso8601String()
                ]) . "\n\n";
                flush();
            });
            
            // Step 3: Clear transactions if requested
            if ($clearTransactions) {
                $this->clearTransactions(function ($message, $progress) {
                    echo "event: clear\n";
                    echo "data: " . json_encode([
                        'message' => $message,
                        'progress' => $progress,
                        'timestamp' => now()->toIso8601String()
                    ]) . "\n\n";
                    flush();
                });
            }
            
            // Send completion event
            echo "event: complete\n";
            echo "data: " . json_encode([
                'message' => 'Tạo năm học mới hoàn tất',
                'timestamp' => now()->toIso8601String()
            ]) . "\n\n";
            flush();
        });
        
        return $response;
    }
    
    /**
     * Backup invoice and transaction data
     *
     * @param callable $progressCallback
     * @return void
     */
    private function backupData(callable $progressCallback)
    {
        try {
            // Create backup directory if it doesn't exist
            $backupDir = storage_path('app/backup');
            if (!File::exists($backupDir)) {
                File::makeDirectory($backupDir, 0755, true);
            }
            
            // Create a timestamped directory for this backup
            $timestamp = now()->format('Y-m-d_H-i-s');
            $currentBackupDir = $backupDir . '/' . $timestamp;
            File::makeDirectory($currentBackupDir, 0755, true);
            
            $progressCallback('Đang chuẩn bị sao lưu dữ liệu', 10);
            
            // Backup invoices
            $invoices = Invoice::all();
            $invoicesJson = json_encode($invoices, JSON_PRETTY_PRINT);
            File::put($currentBackupDir . '/invoices.json', $invoicesJson);
            
            $progressCallback('Đã sao lưu dữ liệu hóa đơn', 30);
            
            // Backup transactions
            $transactions = Transaction::all();
            $transactionsJson = json_encode($transactions, JSON_PRETTY_PRINT);
            File::put($currentBackupDir . '/transactions.json', $transactionsJson);
            
            $progressCallback('Đã sao lưu dữ liệu giao dịch', 50);
            
            // Create SQL dump if possible
            try {
                $dbName = config('database.connections.pgsql.database');
                $dbUser = config('database.connections.pgsql.username');
                $dbPassword = config('database.connections.pgsql.password');
                $dbHost = config('database.connections.pgsql.host');
                
                // Create SQL dump command
                $command = "PGPASSWORD=\"{$dbPassword}\" pg_dump -h {$dbHost} -U {$dbUser} -d {$dbName} -t invoices -t transactions > {$currentBackupDir}/backup.sql";
                
                // Execute command
                exec($command, $output, $returnVar);
                
                if ($returnVar === 0) {
                    $progressCallback('Đã tạo bản sao lưu SQL', 60);
                } else {
                    Log::warning("SQL dump failed with code {$returnVar}");
                    $progressCallback('Không thể tạo bản sao lưu SQL, tiếp tục với JSON', 60);
                }
            } catch (\Exception $e) {
                Log::warning("SQL dump error: " . $e->getMessage());
                $progressCallback('Không thể tạo bản sao lưu SQL, tiếp tục với JSON', 60);
            }
            
            $progressCallback('Hoàn tất sao lưu dữ liệu', 70);
        } catch (\Exception $e) {
            Log::error("Error backing up data: " . $e->getMessage());
            $progressCallback('Lỗi khi sao lưu dữ liệu: ' . $e->getMessage(), 70);
        }
    }
    
    /**
     * Promote students to the next grade
     *
     * @param callable $progressCallback
     * @return void
     */
    private function promoteStudents(callable $progressCallback)
    {
        try {
            $students = Student::all();
            $totalStudents = $students->count();
            $processed = 0;
            
            $progressCallback('Bắt đầu cập nhật học sinh', 70);
            
            foreach ($students as $student) {
                // Update grade based on current grade
                $currentGrade = $student->grade;
                
                if (is_numeric($currentGrade)) {
                    // If grade is 12, set to LT (Luyện thi)
                    if ((int)$currentGrade === 12) {
                        $student->grade = 'LT';
                    } else {
                        // Otherwise increment by 1
                        $student->grade = (int)$currentGrade + 1;
                    }
                    $student->save();
                }
                
                $processed++;
                
                // Update progress every 10% or for every 100 students
                if ($processed % max(1, round($totalStudents / 10)) === 0 || $processed % 100 === 0) {
                    $progress = 70 + round(($processed / $totalStudents) * 20);
                    $progressCallback("Đã cập nhật {$processed}/{$totalStudents} học sinh", $progress);
                }
            }
            
            $progressCallback("Đã cập nhật {$totalStudents}/{$totalStudents} học sinh", 90);
        } catch (\Exception $e) {
            Log::error("Error promoting students: " . $e->getMessage());
            $progressCallback('Lỗi khi cập nhật học sinh: ' . $e->getMessage(), 90);
        }
    }
    
    /**
     * Clear transactions and invoices
     *
     * @param callable $progressCallback
     * @return void
     */
    private function clearTransactions(callable $progressCallback)
    {
        try {
            $progressCallback('Bắt đầu xóa dữ liệu giao dịch', 90);
            
            // Clear transactions
            Transaction::truncate();
            $progressCallback('Đã xóa dữ liệu giao dịch', 95);
            
            // Clear invoices
            Invoice::truncate();
            $progressCallback('Đã xóa dữ liệu hóa đơn', 98);
            
            // Reset sequences for PostgreSQL
            DB::statement("SELECT setval('transactions_id_seq', 1, false)");
            DB::statement("SELECT setval('invoices_id_seq', 1, false)");
            
            $progressCallback('Đã xóa toàn bộ dữ liệu giao dịch và hóa đơn', 100);
        } catch (\Exception $e) {
            Log::error("Error clearing transactions: " . $e->getMessage());
            $progressCallback('Lỗi khi xóa dữ liệu: ' . $e->getMessage(), 100);
        }
    }
}