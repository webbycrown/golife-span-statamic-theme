<?php

namespace App\Tags;

use Statamic\Tags\Tags;
use Illuminate\Support\Carbon;

class CurrentDate extends Tags
{
    /**
     * The tag handle: {{ current_date }}
     */
    public static function handle()
    {
        return 'current_date';
    }

    /**
     * Usage: {{ current_date }}
     * Output format: 2025-07-21 (Y-m-d)
     */
    public function index()
    {
        return Carbon::now()->toDateString();
    }
}
