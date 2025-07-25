<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Statamic\Facades\Entry;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use App\Helpers\GlobleHelper;


class CustomerAuthController extends Controller
{
  public function register(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'full_name' => 'required|string|max:255',
      'email' => 'required|email',
      'password' => 'required|min:6',
    ]);

    if ($validator->fails()) {
      return response()->json(['errors' => $validator->errors()], 422);
    }

    $existing = Entry::query()
      ->where('collection', 'customer')
      ->where('email', $request->email)
      ->first();

    if ($existing) {
      return response()->json(['message' => 'Email already registered'], 409);
    }

    $entry = Entry::make()
      ->collection('customer')
      ->slug(Str::uuid())
      ->data([
        'title' => $request->full_name,
        'full_name' => $request->full_name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
      ]);

    $entry->save();

    return response()->json(['message' => 'Registered successfully']);
  }

  public function login(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'email' => 'required|email',
      'password' => 'required',
    ]);



    if ($validator->fails()) {
      return response()->json(['errors' => $validator->errors()], 422);
    }

    $entry = Entry::query()
      ->where('collection', 'customer')
      ->where('email', $request->email)
      ->first();

    if (!$entry || !Hash::check($request->password, $entry->get('password'))) {
      return response()->json(['message' => 'Invalid credentials'], 401);
    }

    if ($entry->get('is_blocked') === true || $entry->get('status') === 'blocked') {
      return response()->json(['message' => 'Your account is blocked. By Adminstar.'], 403);
    }

    Session::put('customer_logged_in', true);
    Session::put('customer_id', $entry->id());
    Session::put('customer_email', $entry->get('email'));
    Session::put('customer_full_name', $entry->get('full_name'));

    return response()->json(['message' => 'Login successful']);
  }

  public function logout()
  {
    // Session::forget('customer_id');
    Session::forget(['customer_logged_in', 'customer_id', 'customer_email', 'customer_full_name']);
    return redirect('/');
    // return response()->json(['message' => 'Logged out']);
  }



  public function sendResetLink(Request $request)
  {
    $request->validate([
      'email' => 'required|email',
    ]);

    $customer = Entry::query()
      ->where('collection', 'customer')
      ->where('email', $request->email)
      ->first();

    if (! $customer) {
      return response()->json(['message' => 'Email not found.'], 404);
    }

    $token = Str::random(64);
    Cache::put("reset_token_{$token}", $customer->id(), now()->addMinutes(5));

    $resetUrl = url("/reset-password?token={$token}");

    $mailData = [
      'to' => $request->email,
      'subject' => "Reset Your Password",
      'body' => "Click the link to reset your password (expires in 5 minutes): {$resetUrl}",
      'data' => [],
    ];

    $mailFlag = GlobleHelper::sendMail($mailData);

    if ($mailFlag < 1) {
      Cache::forget("reset_token_{$token}");
      return response()->json(['message' => 'Something went wrong. Try again.'], 500);
    }

    return response()->json(['message' => 'Reset link sent successfully. Check your email.']);
  }

  public function resetPassword(Request $request)
  {
    // 1. Validate input
    $request->validate([
      'token' => 'required',
      'password' => 'required|min:6',
      'password_confirmation' => 'required|confirmed|min:6',
    ], [
      'token.required' => 'The reset token does not match. Please try again later.',
      'password.required' => 'The password is required.',
      'password.min' => 'The password must be at least 6 characters.',
      'password_confirmation.required' => 'The password confirmation is required.',
      'password_confirmation.min' => 'The password confirmation must be at least 6 characters.',
      'password_confirmation.confirmed' => 'The password confirmation does not match.',
    ]);

    // 2. Retrieve customer ID using token from cache
    $customerId = Cache::get("reset_token_{$request->token}");

    if (! $customerId) {
      return response()->json([
        'message' => 'Invalid or expired reset token.',
      ], 422); // Use 422 for validation-related errors
    }

    // 3. Retrieve the customer entry
    $customer = Entry::find($customerId);

    if (! $customer) {
      return response()->json([
        'message' => 'Customer not found.',
      ], 404);
    }

    // 4. Update password
    $customer->set('password', Hash::make($request->password))->save();

    // 5. Clear the token cache
    Cache::forget("reset_token_{$request->token}");

    // 6. Return success response
    return response()->json([
      'message' => 'Password reset successfully.',
    ]);
  }
}
