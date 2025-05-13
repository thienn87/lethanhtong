<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSearchIndexes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add indexes to Student table
        Schema::table('students', function (Blueprint $table) {
            $table->index('mshs');
            $table->index('full_name');
            $table->index('class');
            $table->index('grade');
            $table->index('discount');
        });

        // Add indexes to Transaction table
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('mshs');
            $table->index('student_name');
        });

        // Add indexes to Invoice table
        Schema::table('invoices', function (Blueprint $table) {
            $table->index('mshs');
            $table->index('invoice_id');
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Remove indexes from Student table
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['mshs']);
            $table->dropIndex(['full_name']);
            $table->dropIndex(['class']);
            $table->dropIndex(['grade']);
            $table->dropIndex(['discount']);
        });

        // Remove indexes from Transaction table
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['mshs']);
            $table->dropIndex(['student_name']);
        });

        // Remove indexes from Invoice table
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['mshs']);
            $table->dropIndex(['invoice_id']);
            $table->dropIndex(['transaction_id']);
        });
    }
}