<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Razorpay\Api\Api;
use Statamic\Facades\Entry;
use Statamic\Facades\GlobalSet;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RazorpayController extends Controller
{
    protected function getApi()
    {
        $globals = GlobalSet::findByHandle('payment_configuration')->inDefaultSite()->data();
        return new Api($globals->get('razorpay_key'), $globals->get('razorpay_secret'));
    }

    public function createOrder(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'currency' => 'required|in:INR,USD,CAD,GBP,AUD,EUR',
        ]);

        $order = $this->getApi()->order->create([
            'receipt' => 'donation_' . time(),
            'amount' => $request->amount * 100,
            'currency' => $request->currency,
        ]);

        return response()->json([
            'order_id' => $order['id'],
            'amount' => $order['amount']
        ]);
    }

    public function createSubscriptionDynamic(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'currency' => 'required|in:INR',
            'email' => 'required|email',
            'phone' => 'required|string'
        ]);

        $api = $this->getApi();

        $plan = $api->plan->create([
            'period' => 'monthly',
            'interval' => 1,
            'item' => [
                'name' => 'Monthly Donation - ₹' . $request->amount,
                'amount' => $request->amount * 100,
                'currency' => $request->currency,
                'description' => 'Monthly recurring donation'
            ]
        ]);

        $subscription = $api->subscription->create([
            'plan_id' => $plan->id,
            'customer_notify' => 1,
            'total_count' => 12
        ]);

        return response()->json([
            'subscription_id' => $subscription->id
        ]);
    }

    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        $event = $payload['event'] ?? null;

        // log::info('Razorpay Webhook Payload', $payload);
        if (!in_array($event, ['payment.captured', 'subscription.charged'])) {
            return response()->json(['status' => 'ignored'], 200);
        }
        $payment = $payload['payload']['payment']['entity'];

        $existing = Entry::query()
            ->where('collection', 'donation')
            ->where('payment_id', $payment['id'])
            ->first();

        if ($existing) {
            return response()->json(['status' => 'duplicate'], 200);
        }


        // Log::info('Razorpay Webhook Payment Data', $request->all());

        $currency = strtoupper($payment['currency']);
        $amount = $payment['amount'] / 100;

        $rates = GlobalSet::findByHandle('exchange_rates')->inDefaultSite()->data()->get('currency_rate') ?? [];
        $exchangeRates = collect($rates)->mapWithKeys(fn($r) => [strtoupper($r['currency']) => (float)$r['rate']]);
        $amountInINR = $currency === 'INR' ? $amount : round($amount * ($exchangeRates[$currency] ?? 1), 2);

        $notes = $payment['notes'] ?? [];
        $type = isset($payment['subscription_id']) ? 'Monthly Funding' : ($notes['pay_type'] ?? 'One Time Funding');
        $campaign = $notes['campaign_id'] ?? "-";

        // Try to find donor entry
        $customerEntry = $notes['full_name'] ? Entry::find($notes['full_name']) : null;
        $donorId = $customerEntry ? $notes['full_name'] : '-';


        Entry::make()
            ->collection('donation')
            ->data([
                'title'           => 'donation_' . Str::uuid(),
                'donor_name'      => $donorId,
                'email'           => $notes['donor_email'],
                'pan'             => $notes['pan'] ?? null,
                'phone_number'    => $notes['donor_phone'] ?? $payment['contact'],
                'donation_type'   => $type,
                'campaign'        => ($campaign === 'null' || $campaign === '') ? '-' : $campaign,
                'amount'          => $amount,
                'amount_inr'      => $amountInINR,
                'currency_name'   => strtoupper($currency),
                'payment_id'      => $payment['id'] ?? $notes['subscription_id'],
                'subscription_id' => $notes['subscription_id'] ?? null,
                'date'            => Carbon::now()->toDateTimeString(),
            ])
            ->save();

        return response()->json(['status' => 'saved'], 200);
    }

    public function pauseSubscription(Request $request)
    {
        $request->validate(['subscription_id' => 'required|string']);
        $this->getApi()->subscription->fetch($request->subscription_id)->pause(['pause_at' => 'now']);
        return response()->json(['status' => 'paused']);
    }

    public function resumeSubscription(Request $request)
    {
        $request->validate(['subscription_id' => 'required|string']);
        $this->getApi()->subscription->fetch($request->subscription_id)->resume(['resume_at' => 'now']);
        return response()->json(['status' => 'resumed']);
    }

    public function cancelSubscription(Request $request)
    {
        $request->validate(['subscription_id' => 'required|string']);
        $this->getApi()->subscription->fetch($request->subscription_id)->cancel();
        return response()->json(['status' => 'cancelled']);
    }

    public function validateDonation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255',
            'email' => 'required|email',
            'phonenumber' => 'required|max:10|min:10',
            'amount' => 'required|numeric|min:0.1',
            'currency' => 'required',
            'pan' => 'nullable|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/',
        ], [
            'username.required' => 'Full name is required.',
            'username.max' => 'Full name must not exceed 255 characters.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Enter a valid email address.',
            'phonenumber.required' => 'Phone number is required.',
            'phonenumber.min' => 'Phone number must be 10 digits.',
            'phonenumber.max' => 'Phone number must be 10 digits.',
            'amount.required' => 'Donation amount is required.',
            'amount.numeric' => 'Donation amount must be a number.',
            'amount.min' => 'Donation amount must be at least ₹1.',
            'currency.required' => 'Currency is required.',
            'pan.regex' => 'Enter a valid PAN number (e.g. ABCDE1234F).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        return response()->json(['status' => 'success']);
    }
    public function getAllSubscriptions(Request $request)
    {
        $customerId = session('customer_id');
        if (!$customerId) {
            return response()->json(['subscriptions' => []], 401);
        }

        $subscriptions = Entry::query()
            ->where('collection', 'donation')
            ->where('donor_name', $customerId)
            ->where('donation_type', 'Monthly Funding')
            ->whereNotNull('subscription_id')
            ->get()
            ->unique('subscription_id');

        $result = [];

        foreach ($subscriptions as $sub) {
            try {
                $subscriptionId = $sub->get('subscription_id');
                $razorSub = $this->getApi()->subscription->fetch($subscriptionId);

                $result[] = [
                    'subscription_id' => $subscriptionId,
                    'amount'          => '₹' . number_format($razorSub['plan']['item']['amount'] / 100, 2),
                    'interval'        => ucfirst($razorSub['plan']['period']),
                    'status'          => $razorSub['status'],
                    'next_billing_at' => Carbon::createFromTimestamp($razorSub['current_end'])->format('d-m-Y'),
                    'auto_pay_enabled' => $razorSub['status'] === 'active',
                    'cancel_at'       => $razorSub['cancel_at']
                        ? Carbon::createFromTimestamp($razorSub['cancel_at'])->format('d-m-Y')
                        : null,
                ];
            } catch (\Exception $e) {
                $result[] = [
                    'subscription_id' => $subscriptionId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json(['subscriptions' => $result]);
    }
}
