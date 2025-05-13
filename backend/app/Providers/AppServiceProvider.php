<?php

namespace App\Providers;
use App\Observers\StudentObserver;
use Illuminate\Support\ServiceProvider;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */

    public function boot()
    {
        // Register the Student observer
        Student::observe(StudentObserver::class);
        DB::statement("SET TIME ZONE 'Asia/Ho_Chi_Minh'");
    }
}
