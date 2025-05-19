<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('mshs')->index('idx_students_mshs');
            $table->string('sur_name');
            $table->string('name');
            $table->string('full_name')->index();
            $table->date('day_of_birth');
            $table->string('grade')->index();
            $table->string('class')->index();
            $table->string('gender');
            $table->string('parent_name');
            $table->text('address');
            $table->string('phone_number');
            $table->date('day_in');
            $table->date('day_out')->nullable();
            $table->boolean('stay_in')->default(false);
            $table->boolean('leave_school')->default(false);
            $table->boolean('fail_grade')->default(false);
            $table->integer('extra_fee')->nullable()->default(0);
            $table->string('extra_fee_note')->nullable();
            $table->integer('discount')->default(0)->index();
            $table->timestamps();

            $table->index(['mshs']);
            $table->unique(['mshs']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
