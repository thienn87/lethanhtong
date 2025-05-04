<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    //invoice_no format: xxxx/03
    //Trong đó, xxxx là Thứ tự hóa đơn phát sinh trong tháng bắt đầu từ ngày 1 đến hết tháng
    //03 là tháng hiện tại

    //invoice_details: là tiêu đề hóa đơn, được nhập khi thu học phí
    protected $fillable = ['transaction_id', 'invoice_details', 'invoice_id', 'mshs'];

}
