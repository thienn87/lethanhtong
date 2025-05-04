<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OutstandingDebt extends Model
{
    use HasFactory;
    protected $table = 'outstandingdebt';

    protected $fillable = [
        'year',
        'revenue',
        'outstandingdebt',
        'debt',
    ];
}
