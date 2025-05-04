<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TuitionGroupsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $tuitionGroups =  [
               [
                   'code' => 'HP06',
                   'name' => 'Học phí khối 6',
                   'default_amount' => 3645000,
                   'grade' =>  '6',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP07',
                   'name' => 'Học phí khối 7',
                   'default_amount' => 3870000,
                   'grade' =>  '7',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP08',
                   'name' => 'Học phí khối 8',
                   'default_amount' => 4095000,
                   'grade' =>  '8',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP09',
                   'name' => 'Học phí khối 9',
                   'default_amount' => 4620000,
                   'grade' =>  '9',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP10',
                   'name' => 'Học phí khối 10',
                   'default_amount' => 5220000,
                   'grade' =>  '10',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP11',
                   'name' => 'Học phí khối 11',
                   'default_amount' => 5685000,
                   'grade' =>  '11',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'HP12',
                   'name' => 'Học phí khối 12',
                   'default_amount' => 6975000,
                   'grade' =>  '12',
                   'group' =>'HP',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT06',
                   'name' => 'Bán trú khối 6',
                   'default_amount' => 2720000,
                   'grade' =>  '6',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT07',
                   'name' => 'Bán trú khối 7',
                   'default_amount' => 2720000,
                   'grade' =>  '7',
                   'group' =>'BT',
                   'month_apply' => '9,10',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT08',
                   'name' => 'Bán trú khối 8',
                   'default_amount' => 2720000,
                   'grade' =>  '8',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT09',
                   'name' => 'Bán trú khối 9',
                   'default_amount' => 2840000,
                   'grade' =>  '9',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT10',
                   'name' => 'Bán trú khối 10',
                   'default_amount' =>  2920000,
                   'grade' =>  '10',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT11',
                   'name' => 'Bán trú khối 11',
                   'default_amount' => 3010000,
                   'grade' =>  '11',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BT12',
                   'name' => 'Bán trú khối 12',
                   'default_amount' => 3100000,
                   'grade' =>  '12',
                   'group' =>'BT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'NT10',
                   'name' => 'Phụ thu nội trú khối 10',
                   'default_amount' =>  6140000,
                   'grade' =>  '10',
                   'group' =>'NT',
                   'month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'NT11',
                   'name' => 'Phụ thu nội trú khối 11',
                   'default_amount' =>6280000,
                   'grade' =>  '11',
                   'group' =>'NT','month_apply' => '1,2,3,4,5,6,7,8,9,10,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'NT12',
                   'name' => 'Phụ thu nội trú khối 12',
                   'default_amount' => 6580000,
                   'grade' =>  '12',
                   'group' =>'NT',
                   'month_apply' => '9,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
                [
                   'code' => 'AC',
                   'name' => 'Ăn chiều',
                   'default_amount' => 350000,
                   'grade' =>  '12',
                   'group' =>'AC',
                   'month_apply' => '9,11,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               /*Lệ Phí Và Bảo Hiêm*/
               [
                   'code' => 'LP',
                   'name' => 'Lệ năm học',
                   'default_amount' => 660000,
                   'grade' =>  '6,7,8,9,10,11,12',
                   'group' =>'LP',
                   'month_apply' => '9,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'BH',
                   'name' => 'Bảo hiểm y tế',
                   'default_amount' => 885000,
                   'grade' =>  '12',
                   'group' =>'NT','month_apply' => '1,9,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ],
               [
                   'code' => 'LPNT',
                   'name' => 'Lệ phí nội trú',
                   'default_amount' => 350000,
                   'grade' =>  '12',
                   'group' =>'LPNT','month_apply' => '1,2,9,12',
                   'created_at' => Carbon::now(),
                   'updated_at' => Carbon::now(),
               ]
              
           ];

        DB::table('tuition_groups')->insert($tuitionGroups);
    }
}
