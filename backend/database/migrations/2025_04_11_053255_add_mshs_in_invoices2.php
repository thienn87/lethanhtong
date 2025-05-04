
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
        Schema::table('invoices', function (Blueprint $table) {
            // Check if the column exists before trying to add it
            if (!Schema::hasColumn('invoices', 'mshs')) {
                $table->string('mshs')->nullable()->after('invoice_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the column if it exists
            if (Schema::hasColumn('invoices', 'mshs')) {
                $table->dropColumn('mshs');
            }
        });
    }
};
