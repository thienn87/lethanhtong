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
        'paid_code',
        'amount_paid',
        'payment_date',
        'note',
        'invoice_no',
        'created_at',
        'year_month', // <-- Add this line
    ];

    // Tự động append thuộc tính không có trong DB
    protected $appends = ['tuition_name'];

    // Accessor để thêm thuộc tính tuition_name
    public function getTuitionNameAttribute()
    {
        if($this->paid_code == 'OT'){
             $tuitionGroupName = $this->note;
        }
        else{
            $tuitionGroup = TuitionGroup::where('code', $this->paid_code)->first();
             $tuitionGroupName = $tuitionGroup ? $tuitionGroup->name : "";
        }
        return $tuitionGroupName;
    }
}
