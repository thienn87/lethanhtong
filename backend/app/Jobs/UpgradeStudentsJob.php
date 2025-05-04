<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\Student;

class UpgradeStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(){

        $students = Student::all();

        foreach ($students as $student) {
            /**
             * co the chia nho queue tuy muc dich
             * **/
            Log::info('-- Update lop hoc cho hoc sinh ' . $student->full_name . ' --');
            Log::info('::Lop cu ' . $student->grade . '::');
            if ($student->grade < 12) {
                $student->grade += 1;
            } else {
                $student->grade = '12+';
            }
            $student->save();
            Log::info('::Lop moi ' . $student->grade . '::');
        }
    }
}
