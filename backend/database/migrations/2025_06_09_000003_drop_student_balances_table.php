<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class DropStudentBalancesTable extends Migration
{
    public function up()
    {
        Schema::dropIfExists('student_balances');
    }

    public function down()
    {
        // Optionally, you could recreate the table here if needed
        // But typically, leave this empty for a drop migration
    }
}