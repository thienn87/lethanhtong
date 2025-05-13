
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 0: Drop defaults
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN duno DROP DEFAULT;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dudau DROP DEFAULT;');

        // Step 1: Convert to text
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN duno TYPE text USING duno::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dudau TYPE text USING dudau::text;');

        // Step 2: Convert to jsonb
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN duno TYPE jsonb USING duno::jsonb;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dudau TYPE jsonb USING dudau::jsonb;');

        // Step 3: (Optional) Set new defaults
        DB::statement("ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN duno SET DEFAULT '[]';");
        DB::statement("ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dudau SET DEFAULT '[]';");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally, revert back to text or varchar if needed
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN duno TYPE text USING duno::text;');
        DB::statement('ALTER TABLE tuition_monthly_fee_listings ALTER COLUMN dudau TYPE text USING dudau::text;');
    }
};
