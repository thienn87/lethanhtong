<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grades extends Model
{
    use HasFactory;

    protected $fillable = ['grade', 'name', 'tuition_group_ids'];

    protected $casts = [
        'tuition_group_ids' => 'array',
    ];
}
