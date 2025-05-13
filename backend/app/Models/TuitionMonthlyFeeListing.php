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
        'year_month',
        'mshs',
        'student_name',
        'tuitions',
        'dudau',
        'phaithu',
        'dathu',
        'duno',
        'invoice_ids'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'invoice_ids' => 'array',
        'dudau' => 'array',
        'phaithu' => 'array',
        'dathu' => 'array',
        'duno' => 'array',
    ];

    // Scope for filtering by year and month
    public function scopeForMonth($query, $year, $month)
    {
        $yearMonth = sprintf('%d-%02d', $year, $month);
        return $query->where('year_month', $yearMonth);
    }

    // Scope for filtering by student
    public function scopeForStudent($query, $mshs)
    {
        return $query->where('mshs', $mshs);
    }
}