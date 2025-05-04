<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TuitionMonthlyFeeListing extends Model
{
    use HasFactory;
    protected $fillable = [
        'month',
        'year', 
        'mshs',
        'student_name',
        //Gồm các mã học phí trong bảng tuitions_groups
        'tuitions', 
        //Du đầu bằng dư cuối + phải thủ trong tháng
        'dudau', 
        //tổng số học phí phải thu trong tháng
        'phaithu',
        //số tiền đã thu được, cộng dồn bằng các transaction
        'dathu',
        //Dư nợ là dư Dư đầu trừ đã thu
        'duno',
        //Link với số id của giao dịch thu học phí
        'transaction_id'
    ];
}
