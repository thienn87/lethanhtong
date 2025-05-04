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
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            //
            $table->string('student_name')->nullable()->after('mshs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tuition_monthly_fee_listings', function (Blueprint $table) {
            //
        });
    }
};
