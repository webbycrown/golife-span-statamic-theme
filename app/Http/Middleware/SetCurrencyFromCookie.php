<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetCurrencyFromCookie
{
    public function handle(Request $request, Closure $next): mixed
    {
        // Use raw $_COOKIE with isset() check
        if (isset($_COOKIE['selected_currency'])) {
            session(['selected_currency' => $_COOKIE['selected_currency']]);
        }

        return $next($request);
    }
}
