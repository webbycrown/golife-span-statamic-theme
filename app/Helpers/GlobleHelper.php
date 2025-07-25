<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class GlobleHelper
{
    public static function sendMail(?array $mailData = [])
    {
        try {
            // Check required keys
            if (empty($mailData['to']) || empty($mailData['subject']) || empty($mailData['body'])) {
                Log::error('Mail data missing required fields.');
                return 0;
            }

            // Send the email
            Mail::raw($mailData['body'], function ($message) use ($mailData) {
                $message->to($mailData['to'])
                        ->subject($mailData['subject']);
            });
            // dd($mailData);

            return 1; // Success
        } catch (\Exception $e) {
            Log::error('Mail send failed: ' . $e->getMessage());
            return 0;
        }
    }
}
