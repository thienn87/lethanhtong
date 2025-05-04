<?php 

namespace App\Jobs;

use App\Exports\InvoiceExport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

class ExportInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $fileName;
    protected $date;

    public function __construct($fileName, $date = null)
    {
        $this->fileName = $fileName; 
        $this->date = $date;
    }

    public function handle()
    {
        $export = new InvoiceExport($this->date);
        $fileName = $this->fileName;

        // Đường dẫn public và temp
        $publicPath = public_path($fileName);
        $tempPath = storage_path('app/public/temp/' . $fileName);

        // Xoá file ở public nếu có
        if (file_exists($publicPath)) {
            unlink($publicPath);
        }

        // Xoá file tạm nếu có
        if (file_exists($tempPath)) {
            unlink($tempPath);
        }
        // Lưu file tạm vào storage/app/public/
        Excel::store($export, 'temp/' . $this->fileName, 'public');

        // Copy từ storage/app/public/temp/... sang public/
        $from = storage_path('app/public/temp/' . $this->fileName);
        $to = public_path($this->fileName);

        copy($from, $to);
    }
}
