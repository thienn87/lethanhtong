<?php
namespace App\Exports;

use App\Models\Invoice;
use App\Models\Student;
use App\Models\Transaction;

use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Events\AfterSheet;

class InvoiceExport implements WithEvents
{
    protected $date;

    public function __construct($date = null)
    {
        $this->date = $date;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Header công ty
                $sheet->setCellValue('A1', 'C.TY TNHH GIÁO DỤC THÀNH TÍN');
                $sheet->setCellValue('A2', '22 TÂN THẮNG, Q.TÂN PHÚ');
                $sheet->getStyle('A1:A2')->getFont()->setBold(true);

                // Tiêu đề bảng
                $sheet->mergeCells('C3:M3');
                $sheet->setCellValue('C3', 'BẢNG KÊ THU HỌC PHÍ');
                $sheet->getStyle('C3')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('C3')->getAlignment()->setHorizontal('center');

                // Ngày
                $sheet->mergeCells('C4:M4');
                $sheet->setCellValue('C4', 'Ngày ' . now()->format('d/m/Y'));
                $sheet->getStyle('C4')->getAlignment()->setHorizontal('center');

                

                // Tiêu đề cho các cột
                $sheet->setCellValue('A6', 'STT');
                $sheet->setCellValue('B6', 'Chứng từ');
                $sheet->setCellValue('D6', 'Học sinh');

                $sheet->setCellValue('B7', 'Số');
                $sheet->setCellValue('C7', 'Ngày');
                $sheet->setCellValue('D7', 'Mã số');
                $sheet->setCellValue('E7', 'Lớp');
                $sheet->setCellValue('F7', 'Học sinh');
                
                $sheet->setCellValue('G6', 'Học phí');
                $sheet->setCellValue('H6', 'Tin học Ngoại ngữ Luyện thi');
                $sheet->setCellValue('I6', 'Bán trú');
                $sheet->setCellValue('J6', 'Nội trú');
                $sheet->setCellValue('K6', 'Ăn sáng');
                $sheet->setCellValue('L6', 'Lệ phí bảo hiểm');
                $sheet->setCellValue('M6', 'Tổng cộng');

                // HEADER CỘT (DÒNG 6)
                // Merge các header của bảng
                $sheet->mergeCells('A6:A7'); // STT (merge 2 dòng)
                $sheet->mergeCells('B6:C6'); // Số (merge 2 dòng)
                $sheet->mergeCells('D6:F6'); // Số (merge 2 dòng)

                $sheet->mergeCells('G6:G7'); // Số (merge 2 dòng)
                $sheet->mergeCells('H6:H7'); // Số (merge 2 dòng)
                $sheet->mergeCells('I6:I7'); // Số (merge 2 dòng)
                $sheet->mergeCells('J6:J7'); // Số (merge 2 dòng)
                $sheet->mergeCells('K6:K7'); // Số (merge 2 dòng)
                $sheet->mergeCells('L6:L7'); // Số (merge 2 dòng)
                $sheet->mergeCells('M6:M7'); // Số (merge 2 dòng)
                // Style cho các header
                $sheet->getStyle('A6:M7')->getFont()->setBold(true);
                $sheet->getStyle('A6:M7')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('A6:M7')->getAlignment()->setVertical('center');
                $sheet->getStyle('A6:M7')->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['argb' => 'FF000000'], // màu đen
                        ],
                    ],
                ]);
                

                // Các dòng dữ liệu sẽ được chèn từ dòng 7 trở đi
                $row = 8;
                $stt = 1;
                $query = Invoice::query();
                if ($this->date) {
                    $query->whereDate('created_at', $this->date);
                }
                $invoices = $query->get();

                foreach ($invoices as $invoice) {
                    // Cột A: STT
                    $sheet->setCellValue('A' . $row, $stt++);
                
                    // Cột B: Số (invoice_id)
                    $sheet->setCellValue('B' . $row, $invoice->invoice_id);
                    $sheet->setCellValue('C' . $row, $invoice->created_at);
                    $sheet->setCellValue('D' . $row, $invoice->mshs);
                    
                    $student = Student::where('mshs', $invoice->mshs)->first();
                    $sheet->setCellValue('E' . $row, $student ? "'" . $student->grade . strval($student->class) : '');
                    $sheet->setCellValue('F' . $row, $student ? $student->sur_name . ' ' . $student->name . ' (' . $invoice->invoice_details . ')' : '');

                    $transactions = $invoice->transaction_id;
                    // Tính tổng từng loại phí
                    $totals = [
                        'G' => 0, // Học phí
                        'H' => 0, // Tin học, Ngoại ngữ, Luyện thi
                        'I' => 0, // Bán trú
                        'J' => 0, // Nội trú
                        'K' => 0, // Ăn sáng
                        'L' => 0, // Bảo hiểm
                    ];

                    // Lấy các transaction ID từ chuỗi, ví dụ: "4,5,6"
                    $transactionIds = explode(',', $invoice->transaction_id);

                    foreach ($transactionIds as $tranId) {
                        $tran = Transaction::find(trim($tranId));
                        if (!$tran) continue;

                        $code = strtoupper($tran->paid_code);
                        $amount = (float) $tran->amount_paid;

                        if (str_contains($code, 'HP')) {
                            $totals['G'] += $amount;
                        } 
                        // elseif (str_contains($code, 'TH') || str_contains($code, 'NN') || str_contains($code, 'LT')) {
                        //     $totals['H'] += $amount;
                        // }
                        elseif (str_contains($code, 'BT')) {
                            $totals['I'] += $amount;
                        } elseif (str_contains($code, 'NT')) {
                            $totals['J'] += $amount;
                        } 
                        // elseif (str_contains($code, 'AS')) {
                        //     $totals['K'] += $amount;
                        // } 
                        elseif (str_contains($code, 'BH')) {
                            $totals['L'] += $amount;
                        }
                    }

                    // Ghi các giá trị vào cột G đến L
                    foreach ($totals as $col => $total) {
                        $sheet->setCellValue($col . $row, $total);
                    }
                    $sheet->setCellValue('M' . $row, array_sum($totals) > 0 ? number_format(array_sum($totals), 0, ',', '.') : '');
                
                    $row++;
                }


                // set tổng cộng
                $sheet->setCellValue('A' . $row, 'TỔNG CỘNG');
                $sheet->getStyle('A' . $row)->getFont()->setBold(true);
                $sheet->mergeCells('A' . $row . ':' . 'F' . $row); // Số (merge 2 dòng)
                // tính tổng học phí bằng G8 tới G$row
                $sheet->setCellValue('G' . $row, '=SUM(G8:G' . ($row - 1) . ')');
                $sheet->getStyle('G' . $row)->getFont()->setBold(true);

                // Tính tổng các cột H, I, J, K, L, M
                foreach (['H', 'I', 'J', 'K', 'L', 'M'] as $col) {
                    $sheet->setCellValue($col . $row, '=SUM(' . $col . '8:' . $col . ($row - 1) . ')');
                    $sheet->getStyle($col . $row)->getFont()->setBold(true);
                }

            },
        ];
    }
}
