<?php
namespace App\Http\Controllers;

use App\Models\Student;

use Illuminate\Http\Request;

class AdminController extends Controller
{   
    public function update(Request $request){

        return response()->json([
            'status' => 'success'
        ]);
    }

    public function login(Request $request){

        return response()->json([
            'status' => 'success'
        ]);
    }
    
}
