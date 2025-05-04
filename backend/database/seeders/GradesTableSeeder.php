<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Grades;
class GradesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $grades = [
            ['grade' => '6', 'name' => 'Khối 6', 'tuition_group_ids' => []],
            ['grade' => '7', 'name' => 'Khối 7', 'tuition_group_ids' => []],
            ['grade' => '8', 'name' => 'Khối 8', 'tuition_group_ids' => []],
            ['grade' => '9', 'name' => 'Khối 9', 'tuition_group_ids' => []],
            ['grade' => '10', 'name' => 'Khối 10', 'tuition_group_ids' => []],
            ['grade' => '11', 'name' => 'Khối 11', 'tuition_group_ids' => []],
            ['grade' => '12', 'name' => 'Khối 12', 'tuition_group_ids' => []],
        ];

        foreach ($grades as $grade) {
            Grades::create($grade);
        }
    }
}
