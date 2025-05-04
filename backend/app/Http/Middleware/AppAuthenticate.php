<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->query('token', '');
        $id = $request->query('id', '');
        $password = $request->query('password', '');

        if ($token !== env('TOKEN')) {
            return response()->json(['success' => false, 'error' => 'Invalid token']);
        }

        $password_md5 = md5($password);
        $admin = DB::table('admins')
            ->where('user', $id)
            ->where('password', $password_md5)
            ->first();

        if (!$admin) {
            return response()->json(['success' => false, 'error' => 'Invalid credentials']);
        }

        return $next($request);
    }
}
