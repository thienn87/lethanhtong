
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 0: Drop defaults
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN phaithu DROP DEFAULT;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dathu DROP DEFAULT;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN invoice_ids DROP DEFAULT;');

        // Step 1: Convert to text
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN phaithu TYPE text USING phaithu::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dathu TYPE text USING dathu::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN invoice_ids TYPE text USING invoice_ids::text;');

        // Step 2: Convert to jsonb
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN phaithu TYPE jsonb USING phaithu::jsonb;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dathu TYPE jsonb USING dathu::jsonb;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN invoice_ids TYPE jsonb USING invoice_ids::jsonb;');

        // Step 3: (Optional) Set new defaults
        DB::statement("ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN phaithu SET DEFAULT '[]';");
        DB::statement("ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dathu SET DEFAULT '[]';");
        DB::statement("ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN invoice_ids SET DEFAULT '[]';");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally, revert back to text or varchar if needed
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN phaithu TYPE text USING phaithu::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dathu TYPE text USING dathu::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN invoice_ids TYPE text USING invoice_ids::text;');
    }
};
