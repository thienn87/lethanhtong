<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TuitionFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'tuition_group_id', 'amount_paid', 'payment_date', 'note'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function tuitionGroup()
    {
        return $this->belongsTo(TuitionGroup::class, 'tuition_group_id');
    }
}
