
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
            // Drop invoice_no column if it exists
            if (Schema::hasColumn('invoices', 'invoice_no')) {
                $table->dropColumn('invoice_no');
            }
            
            // Add mshs column if it doesn't exist
            if (!Schema::hasColumn('invoices', 'mshs')) {
                $table->string('mshs')->after('invoice_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Add back invoice_no column if it doesn't exist
            if (!Schema::hasColumn('invoices', 'invoice_no')) {
                $table->string('invoice_no')->nullable();
            }
            
            // Drop mshs column if it exists
            if (Schema::hasColumn('invoices', 'mshs')) {
                $table->dropColumn('mshs');
            }
        });
    }
};
