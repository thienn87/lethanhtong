<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\StudentBalance;

class StudentBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get all students that don't have a balance record
        $students = Student::whereNotIn('mshs', function($query) {
            $query->select('mshs')->from('student_balance');
        })->get();
        
        foreach ($students as $student) {
            StudentBalance::create([
                'mshs' => $student->mshs,
                'balance' => 0
            ]);
        }
        
        $this->command->info('Created balance records for ' . count($students) . ' students.');
    }
}