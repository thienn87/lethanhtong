<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            StudentsTableSeeder::class,
            ClassesTableSeeder::class,
            TuitionGroupsTableSeeder::class,
            GradesTableSeeder::class,
            TransactionSeeder::class,
            StudentBalanceSeeder::class,
            CsvBalanceSeeder::class,
        ]);
    }
}
