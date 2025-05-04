<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/', function () {
    /** Test api **/
    return view('welcome');
});

use App\Http\Controllers\StudentController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\TuitionController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TuitionMonthlyFeeListingController;
use App\Http\Controllers\InvoiceController;
use App\Jobs\ExportInvoiceJob;
use App\Exports\StudentsExport;
use App\Jobs\ExportStudentsJob;
use App\Jobs\ExportStudentsJobFilter;
use App\Http\Controllers\StudentImportController;
use App\Http\Controllers\StudentUpdateController;
use App\Http\Controllers\StudentBalanceController;
use App\Http\Controllers\TransactionFeeController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\DashboardController;


Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
Route::get('/school-year/create-new', [SchoolYearController::class, 'createNewSchoolYear']);
Route::prefix('students')->group(function () {

    /** Get list of student GET : /api/students **/
    Route::get('/', [StudentController::class, 'get'])->name('students.index');

    /** Update information student POST /api/students/update **/
    Route::post('/update', [StudentController::class, 'update'])->name('students.update');
    
    Route::get('/student/balance', [StudentBalanceController::class, 'getBalance']);
    Route::post('/student/balance/update', [StudentBalanceController::class, 'updateBalance']);
    Route::get('/student/balances', [StudentBalanceController::class, 'getAllBalances']);
    Route::get('/all', [StudentController::class, 'getAllStudents']);
    Route::get('/export', function () {

        // Tạo tên file dựa trên ngày hiện tại
        $fileName = 'students-' . now()->format('Y-m-d') . '.csv';
        
        // Đường dẫn vật lý trong thư mục public
        $filePath = public_path($fileName);
        
        // URL để trả về cho client
        $fileUrl = config('app.url') . '/' . $fileName;
    
        // Kiểm tra file đã tồn tại chưa
        if (file_exists($filePath)) {
            // Nếu file đã tồn tại, trả về đường dẫn ngay lập tức
            return response()->json([
                'message' => 'Job are done',
                'filePath' => $fileUrl,
            ]);
        }
    
        // Nếu file chưa tồn tại, dispatch job
        ExportStudentsJob::dispatch($filePath);
    
        // Trả về thông báo
        return response()->json([
            'message' => 'Export job has been queued successfully! Please wait',
            'filePath' => $fileUrl,
        ]);
    });

    Route::get('/export/filter', function (Request $request) {
        // Tạo tên file dựa trên ngày hiện tại
        $fileName = 'students-filter-' . now()->format('Y-m-d') . '.csv';
        
        // Đường dẫn vật lý trong thư mục public
        $filePath = public_path($fileName);
        
        // URL để trả về cho client
        $fileUrl = config('app.url') . '/' . $fileName;
    
        // Lấy thông tin từ request
        $keyword = $request->input('keyword');
        $class = $request->input('class');
        $grade = $request->input('grade');
    
        // Kiểm tra file đã tồn tại chưa
        if (file_exists($filePath)) {
            return response()->json([
                'message' => 'Job are done',
                'filter' => [$keyword, $class, $grade],
                'filePath' => $fileUrl,
            ]);
        }
    
        // Sử dụng lock để tránh race condition
        $lock = Cache::lock('export_students_filter_lock', 10); // Lock trong 10 giây
    
        if ($lock->get()) {
            // Kiểm tra lại lần nữa sau khi có lock
            if (!file_exists($filePath)) {
                // Dispatch job với các tham số từ request
                ExportStudentsJobFilter::dispatch($keyword, $class, $grade, $filePath);
            }
            $lock->release();
    
            return response()->json([
                'message' => 'Export job has been queued successfully! Please wait',
                'debug' => [$keyword, $class, $grade],
                'filePath' => $fileUrl,
            ]);
        }
    
        // Nếu không lấy được lock (đang có job khác chạy)
        return response()->json([
            'message' => 'Another export is in progress, please try again later!',
            'debug' => [$keyword, $class, $grade],
            'filePath' => $fileUrl,
        ]);
    });

    /** Search student GET /api/students/search?mshs=29894 **/
    Route::get('/search', [StudentController::class, 'search'])->name('students.search');

    /** Search student POST /api/students/delete **/
    Route::post('/delete', [StudentController::class, 'delete'])->name('students.delete');
    /** Add new student POST /api/students/create **/
    Route::post('/create', [StudentController::class, 'create'])->name('students.create');    
    /** Upgrade +1 student GET status background /api/students/upgrade **/
    Route::get('/upgrade', [StudentController::class, 'upgrade'])->name('students.upgrade');
    // Import students from Excel file
    Route::post('/import', [StudentImportController::class, 'import']);
    Route::post('/update-batch', [StudentUpdateController::class, 'updateBatch']);

});

Route::prefix('tuitions')->group(function () {
    
    /** Get tuition group : /api/tuitions/group **/
    Route::get('/group', [TuitionController::class, 'getGroup'])->name('tuitions.getGroup');

    /** Add tuition or update for classes POST : /api/tuitions/update **/
    Route::post('/update', [TuitionController::class, 'update'])->name('tuitions.updateTuition');

    /** Add tuition or update for classes POST : /api/tuitions/delete **/
    Route::post('/delete', [TuitionController::class, 'delete'])->name('tuitions.delete');

    /** Create tuition group : /api/tuitions/group/create **/
    Route::post('/group/create', [TuitionController::class, 'createGroup'])->name('tuitions.createGroup');
    Route::get('/name', [TuitionController::class, 'getTuitionName'])->name('tuition.getName');
    /** 
     * Refactored & tested
     * **/

    /** Get tuition details of a student GET : /api/tuitions **/
    Route::get('/', [TuitionController::class, 'getListTuition'])->name('tuitions.tuition');

    /** Create/ update tuition balance of a student POST : /api/students/{id}/tuition-balance **/
    Route::post('/create', [TuitionController::class, 'saveTuition'])->name('tuitions.saveTuition');

    
});

Route::prefix('grades')->group(function () {
    Route::get('/', [GradeController::class, 'index'])->name('grades.index');
    Route::post('/create', [GradeController::class, 'create'])->name('grades.create');
    /** 
     * Refactored & tested
     * **/
    
    Route::post('/update', [GradeController::class, 'update'])->name('grades.update');
}); 

Route::prefix('classes')->group(function () {
    Route::get('/', [ClassController::class, 'index'])->name('classes.index');
    Route::post('/create', [ClassController::class, 'create'])->name('classes.create');
     /** 
     * Refactored & tested
     * **/
    Route::get('/by-grade/{grade}', [ClassController::class, 'getClassesByGrade']);
}); 

Route::prefix('transaction')->group(function () {

    /** Get : /api/transaction/ **/
    Route::get('/', [TransactionController::class, 'index'])->name('transaction.index');

    /** Get : /api/transaction/search **/
    Route::get('/search', [TransactionController::class, 'search'])->name('transaction.search');

    /** Get : /api/transaction/update **/
    Route::post('/update', [TransactionController::class, 'create'])->name('transaction.update');

    /** Get : /api/transaction/update **/
    Route::post('/update/batch', [TransactionController::class, 'updateBatch'])->name('transaction.updateBatch');

    /** Get : /api/transaction/create **/
    Route::post('/create', [TransactionController::class, 'create'])->name('transaction.create');
    
    /** Get : /api/transaction/outstanding-debt **/
    Route::get('/outstanding-debt', [TransactionController::class, 'outstandingDebt'])->name('transaction.outstandingDebt');
    Route::post('/outstanding-debt/export-to-old-data', [TransactionController::class, 'exportOutstandingDebt'])->name('transaction.exportOutstandingDebt');
    Route::get('/outstanding-debt/get-old-data', [TransactionController::class, 'getOldOutstandingDebt'])->name('transaction.getOldOutstandingDebt');
    Route::post('/update-outstanding-debt-batch', [TransactionController::class, 'updateOutstandingDebtBatch']);
    Route::get('/update-outstanding-debt-batch', [TransactionController::class, 'updateOutstandingDebtBatch']);
    Route::get('/detailed-balance', [TransactionController::class, 'getDetailedBalance']);
    Route::post('/update-student-balance', [TransactionController::class, 'updateStudentBalanceDetail']);
    Route::post('/update-all-student-balances', [TransactionController::class, 'updateAllStudentBalances']);
    Route::get('/fee-data', [TransactionFeeController::class, 'getTransactionFeeData']);
    Route::get('/fix-sequence', [TransactionController::class, 'fixSequence']);


    /**
     *  Get : /api/transaction/outstanding-debt/single?mshs=30074
     * **/
    Route::get('/outstanding-debt/single', [TransactionController::class, 'outstandingDebtSingle'])->name('transaction.outstandingDebtSingle');

    // Add these two new routes inside your existing transaction route group
    // They should be placed right after the outstanding-debt/single route

    /**
     *  Get : /api/transaction/outstanding-debt/single?mshs=30074
     * **/
    Route::get('/outstanding-debt/single', [TransactionController::class, 'outstandingDebtSingle'])->name('transaction.outstandingDebtSingle');

    // New search endpoints
    Route::get('/outstanding-debt/search', [TransactionController::class, 'searchOutstandingDebt'])->name('transaction.searchOutstandingDebt');
    Route::get('/student-debts/search', [TransactionController::class, 'searchStudentDebts'])->name('transaction.searchStudentDebts');

    /**
     *  post : /api/transaction/revert?mshs=29894&month=01&amount=20000
     * **/
    Route::post('/revert', [TransactionController::class, 'revert'])->name('transaction.revert');
    /**
     *  post : /api/transaction/revert?mshs=29894&month=01&amount=20000
     * **/
    Route::post('/revert', [TransactionController::class, 'revert'])->name('transaction.revert');

    /** 
     * Refactored & tested
     * **/

    /** Get : /api/transaction/export/excel **/
    Route::get('/export/excel', [TransactionController::class, 'exportFileExcel'])->name('transaction.exportFileExcel');

    /** Get : /api/transaction/export/pdf **/
    Route::get('/export/pdf', [TransactionController::class, 'exportFilePDF'])->name('transaction.exportFilePDF');

});

Route::prefix('admin')->group(function () {

    /** Login : /api/admin **/
    Route::get('/', [AdminController::class, 'login'])->name('admin.adminLogin');

    /** Edit data : /api/admin/update **/
    Route::post('/', [AdminController::class, 'update'])->name('admin.adminUpdate');

});

Route::prefix('tuitionsMonthly')->group(function () {
    
    //TuitionMonthlyFeeListingController
    // /** Create tuition monthly fee : /api/tuitionsMonthly/create **/
    Route::get('/create', [TuitionMonthlyFeeListingController::class, 'create'])->name('tuitionsMonthly.create');
});

Route::prefix('invoice')->group(function () {
    Route::post('/create', [InvoiceController::class, 'create'])->name('InvoiceController.create');
    Route::get('/search', [InvoiceController::class, 'search'])->name('InvoiceController.search');
    Route::post('/update', [InvoiceController::class, 'update'])->name('InvoiceController.update');
    Route::get('/get', [InvoiceController::class, 'get'])->name('InvoiceController.get');
    // Route::post('/delete', [InvoiceController::class, 'delete'])->name('InvoiceController.delete');
    Route::get('/filter', [InvoiceController::class, 'filter'])->name('InvoiceController.filter');
    Route::get('/download', function (Request $request) {
        // Lấy biến 'date' từ query string
        $date = $request->query('date');

        if ($date) {
            $fileUrl = config('app.url') . '/invoice-'.$date.'.xlsx';
            dispatch(new ExportInvoiceJob('invoice-' .$date. '.xlsx', $date));
        }
        else {
            $fileUrl = config('app.url') . '/invoice.xlsx';
            dispatch(new ExportInvoiceJob('invoice.xlsx', $date));
        }
        

        return response()->json([
            'status' => 'success',
            'message' => 'Export job has been queued. You will be notified once the export is complete.',
            'file_path' => $fileUrl // Trả về đường dẫn file (nếu cần dùng sau)
        ]);
    });
    Route::get('/export-excel', [InvoiceController::class, 'exportExcel']);
    Route::get('/detail/{id}', [InvoiceController::class, 'getById']);
   
});
