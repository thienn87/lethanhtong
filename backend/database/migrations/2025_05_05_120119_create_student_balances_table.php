<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentBalancesTable extends Migration
{
    public function up()
    {
        Schema::create('student_balances', function (Blueprint $table) {
            $table->id();
            $table->string('mshs'); // or $table->unsignedBigInteger('mshs') if mshs is numeric
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_balances');
    }
}
