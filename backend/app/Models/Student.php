<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'mshs', 'sur_name', 'name', 'full_name', 'day_of_birth', 'grade', 'class', 'gradeAndClass',
        'stay_in', 'gender', 'discount', 'leave_school', 'parent_name',
        'address', 'phone_number', 'day_in', 'day_out', 'fail_grade', 'extra_fee', 'extra_fee_note',
        'revenue_01','revenue_02','revenue_03','revenue_04','revenue_05','revenue_06','revenue_07','revenue_08','revenue_09','revenue_10','revenue_11','revenue_12',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'stay_in' => 'boolean',
        'leave_school' => 'boolean',
        'fail_grade' => 'boolean',
        'day_of_birth' => 'date',
        'day_in' => 'date',
        'day_out' => 'date',
        'discount' => 'float',
        'extra_fee' => 'float',
    ];

    /**
     * Get the balance record associated with the student.
     */
    

    // public function class()
    // {
    //     return $this->belongsTo(Classes::class, 'class_id');
    // }
    // public function tuitionFees()
    // {
    //     return $this->hasMany(TuitionFee::class, 'student_id');
    // }
}
