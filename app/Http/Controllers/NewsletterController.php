<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Statamic\Facades\Entry;
use Carbon\Carbon;
use Statamic\Facades\Form;
use Illuminate\Support\Facades\Validator;

class NewsletterController extends Controller
{
    /**
     * Handle newsletter subscription.
     * Validates email, checks for duplicates, and saves new submissions.
     */
    public function newsLetter(Request $request)
    {
        // Get email from request, default to empty string
        $email = $request->get('email') ? $request->get('email') : '';

        // Validate email format
        $validator = Validator::make(['email' => $email], [
            'email' => [
                'required',
                'email',
            ]
        ]);

        // If validation fails, return error response
        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Email is required',
            ], 200);
        }

        // Load the 'newsletter' form
        $form = Form::find('newsletter');

        // Check if the email has already been submitted
        $existing = $form->submissions()->filter(function ($item) use ($email) {
            return $item->get('email') === $email;
        })->first();

        // If email already exists, return message
        if ($existing) {
            return response()->json([
                'status' => false,
                'message' => "You are already subscribed"
            ], 200);
        }

        // Save new form submission
        $form->makeSubmission()->data([
            'email' => $email,
        ])->save();

        // Return success response
        return response()->json([
            'status' => true,
            'message' => 'Thank you for subscribing!',
        ]);
    }
}
