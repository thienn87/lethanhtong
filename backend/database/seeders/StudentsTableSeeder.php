<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Student;
use App\Services\SearchService;

class StudentsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $searchService = new SearchService();

        Student::truncate();
        $firstline = true;
        $input_file = fopen(base_path("database/danhsachhocsinh.csv"), "r");
        while (($data = fgetcsv($input_file, null, ";")) !== FALSE) 
        {
            if (!$firstline) {

                $student = $data;
                if( $student[4] == "TRUE")
                    $gender = 'Nam';
                else
                    $gender = 'Nữ';

                Student::create([
                    'mshs'              => $student[0],
                    'sur_name'          => $student[17],
                    'name'              => $student[18],
                    'full_name'         => $searchService->removeVietnameseAccent($student[1]),
                    'day_of_birth' => $this->validateDate($student[2]) ?? '2000-01-01',
                    'grade'             => $student[5],
                    'class'             => $student[6],
                    'stay_in'           => $student[7] === "TRUE" ? true : ($student[7] === "FALSE" ? false : false),
                    'gender'            => $gender,
                    'discount'          => $student[15],
                    'leave_school'      => $student[14] === "TRUE" ? true : ($student[14] === "FALSE" ? false : false),
                    'parent_name'       => $student[9],
                    'address'           => $student[8],
                    'phone_number'      => $student[10],
                    'day_in'            => $this->validateDate($student[11]),
                    'day_out'           => $this->validateDate($student[12]),
                    'fail_grade'        => $student[13] === "TRUE" ? true : ($student[13] === "FALSE" ? false : false),
                ]);
            }
            $firstline = false;
        }
        fclose($input_file);

    }
    private function validateDate($date)
    {
        // Check if the date is empty or invalid
        if (empty(trim($date)) || $date === "  -   -") {
            return null;
        }

        // Validate the date format (YYYY-MM-DD)
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return null;
        }

        return date('Y-m-d', $timestamp);
    }
}

/**
 * Test data : tổng doanh thu hiện tại ( tiền thu thực tế ) tháng 1 : 111045000
 * 
 * **/
