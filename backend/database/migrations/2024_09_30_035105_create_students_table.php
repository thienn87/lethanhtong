<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('mshs')->after('id');
            $table->string('sur_name'); 
            $table->string('name');
            $table->string('full_name');
            $table->date('day_of_birth');
            $table->string('grade');
            $table->string('class'); 
            $table->string('gender');
            $table->string('parent_name'); 
            $table->text('address'); 
            $table->string('phone_number'); 
            $table->date('day_in'); 
            $table->date('day_out')->nullable();

            // status 
            $table->boolean('stay_in')->default(false);  // noi tru 
            $table->boolean('leave_school')->default(false); // con hoc hay khong
            $table->boolean('fail_grade')->default(false); // luu ban
            // Thu phi 
            $table->integer('extra_fee')->default(0)->nullable();
            $table->string('extra_fee_note')->nullable(); 
            // $table->integer('revenue_01')->nullable();
            // $table->integer('revenue_02')->nullable();
            // $table->integer('revenue_03')->nullable();
            // $table->integer('revenue_04')->nullable();
            // $table->integer('revenue_05')->nullable();
            // $table->integer('revenue_06')->nullable();
            // $table->integer('revenue_07')->nullable();
            // $table->integer('revenue_08')->nullable();
            // $table->integer('revenue_09')->nullable();
            // $table->integer('revenue_10')->nullable();
            // $table->integer('revenue_11')->nullable();
            // $table->integer('revenue_12')->nullable();
            $table->integer('discount')->default(0); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('students');
    }
}
