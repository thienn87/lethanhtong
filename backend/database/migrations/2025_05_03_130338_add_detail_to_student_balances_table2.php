<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDetailToStudentBalancesTable2 extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('student_balance', function (Blueprint $table) {
            $table->json('detail')->nullable()->after('balance')
                ->comment('Detailed balance breakdown by tuition group');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('student_balance', function (Blueprint $table) {
            $table->dropColumn('detail');
        });
    }
}