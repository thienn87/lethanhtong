<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\TuitionGroup;
class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'mshs',
        'amount_paid',
        'paid_code',
        'payment_date',
        'note',
        'invoice_no',
        'tuition_group_code', // thêm nếu cần dùng để join
    ];

    // Tự động append thuộc tính không có trong DB
    protected $appends = ['tuition_name'];

    // Accessor để thêm thuộc tính tuition_name
    public function getTuitionNameAttribute()
    {
        $tuitionGroup = TuitionGroup::where('code', $this->paid_code)->first();

        return $tuitionGroup ? $tuitionGroup->name : null;
    }
}
