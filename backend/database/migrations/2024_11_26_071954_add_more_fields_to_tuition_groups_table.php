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
        // Schema::table('tuition_groups', function (Blueprint $table) {
        //     $table->string('grade')->nullable();
        //     $table->string('month_apply')->nullable();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Schema::table('tuition_groups', function (Blueprint $table) {
        //     $table->dropColumn(['grade', 'month_apply', 'group_code']);
        // });
    }
};
