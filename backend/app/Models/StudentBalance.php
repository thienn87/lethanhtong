<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'mshs',
        'balance',
        'detail'
    ];

    protected $casts = [
        'detail' => 'array',
    ];

    /**
     * Get the student that owns the balance.
     */
    public function student()
    {
        return $this->belongsTo(Student::class, 'mshs', 'mshs');
    }

    /**
     * Get the detailed balance as a formatted string
     * 
     * @return string
     */
    public function getFormattedDetailAttribute()
    {
        if (!$this->detail) {
            return '';
        }

        $parts = [];
        foreach ($this->detail as $code => $amount) {
            $parts[] = $code . ':' . number_format($amount, 0, ',', '.');
        }

        return implode(', ', $parts);
    }

    /**
     * Update the balance and detail for a student
     * 
     * @param string $mshs
     * @param float $balance
     * @param array $detail
     * @return StudentBalance
     */
    public static function updateBalance($mshs, $balance, $detail)
    {
        return self::updateOrCreate(
            ['mshs' => $mshs],
            [
                'balance' => $balance,
                'detail' => $detail,
            ]
        );
    }
}