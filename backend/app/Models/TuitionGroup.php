<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TuitionGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 
        'name',
        'classes', 
        'group', 
        'default_amount',
        'grade',
        'month_apply',
    ];

    // public function tuitionFees()
    // {
    //     return $this->hasMany(TuitionFee::class, 'tuition_group_id');
    // }
}
