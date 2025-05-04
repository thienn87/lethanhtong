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
        Schema::create('tuition_groups', function (Blueprint $table) {
            $table->id(); 
            $table->string('code')->unique();
            $table->string('name'); 
            $table->string('group'); 
            $table->string('grade')->nullable();
            $table->string('month_apply')->nullable();
            $table->string('classes')->nullable(); 
            $table->decimal('default_amount', 10, 2); 
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_groups');
    }
};
