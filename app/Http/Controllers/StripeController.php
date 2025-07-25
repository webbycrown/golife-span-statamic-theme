<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Statamic\Facades\GlobalSet;
use Statamic\Facades\Entry;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;
use Razorpay\Api\Api as RazorpayApi;

use Stripe\Subscription;

class StripeController extends Controller
{
    protected function setStripeKeyFromGlobals()
    {
        $globals = GlobalSet::findByHandle('payment_configuration')->inDefaultSite()->data();
        $stripeSecret = $globals->get('stripe_secret_key');

        if (!$stripeSecret) {
            abort(500, 'Stripe secret key not found in Global Set.');
        }

        Stripe::setApiKey($stripeSecret);
    }

    public function validateDonation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255',
            'email' => 'required|email',
            'phonenumber' => 'required',
            'pan' => 'nullable|string|max:10',
            'amount' => 'required|numeric|min:1',
            'currency' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ]);
        }

        return response()->json(['status' => 'success']);
    }

    public function createOneTimeStripeSession(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $customerEntry = $request->name ? Entry::find($request->name) : null;
        $donorId = $customerEntry ? $request->name : '-';

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'mode' => 'payment',
            'customer_email' => $request->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => strtolower($request->currency),
                    'product_data' => ['name' => 'One Time Donation'],
                    'unit_amount' => intval($request->amount * 100),
                ],
                'quantity' => 1,
            ]],
            'success_url' => url('/payment-status?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url' => url('/donation-cancelled'),
            'metadata' => [
                'donor_id'    => $donorId,
                'donor_email' => $request->email,
                'donor_phone' => $request->phone,
                'pan'         => $request->pan,
                'campaign_id' => $request->campaign_id,
                'pay_type'    => 'One Time Funding',
                'currency'    => $request->currency,
                'amount'      => $request->amount,
            ]
        ]);

        return response()->json(['session_id' => $session->id]);
    }

    public function createMonthlySubscription(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'mode' => 'subscription',
            'customer_email' => $request->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => strtolower($request->currency),
                    'product_data' => ['name' => 'GoLifespan Monthly Donation'],
                    'unit_amount' => intval($request->amount * 100),
                    'recurring' => ['interval' => 'month'],
                ],
                'quantity' => 1,
            ]],
            'success_url' => url('/payment-status?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url' => url('/donation-cancelled'),
            'metadata' => [
                'donor_id'    => $request->name ?? '-',
                'donor_email' => $request->email,
                'donor_phone' => $request->phone,
                'pan'         => $request->pan,
                'campaign_id' => $request->campaign_id,
                'pay_type'    => 'Monthly Funding',
                'currency'    => $request->currency,
                'amount'      => $request->amount,
            ]
        ]);

        return response()->json(['session_id' => $session->id]);
    }

    public function handleWebhook(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $globals = GlobalSet::findByHandle('payment_configuration')->inDefaultSite()->data();
        $endpointSecret = $globals->get('stripe_webhook_secret');

        if (!$endpointSecret) {
            return response()->json(['error' => 'Webhook secret missing'], 500);
        }

        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid Stripe signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            try {
                $session = $event->data->object;

                $metadata = (object)($session->metadata ?? []);
                $subscription = $session->subscription ? Subscription::retrieve($session->subscription) : null;

                $email = $session->customer_details->email ?? $session->customer_email;
                $amount = $subscription
                    ? $subscription->items->data[0]->price->unit_amount / 100
                    : $session->amount_total / 100;

                $currency = $subscription
                    ? $subscription->items->data[0]->price->currency
                    : ($metadata->currency ?? $session->currency);

                $subscriptionId = $subscription ? $subscription->id : null;

                $gridData = GlobalSet::findByHandle('exchange_rates')->inDefaultSite()->data()->get('currency_rate') ?? [];
                $exchangeRates = collect($gridData)->mapWithKeys(fn($row) => [
                    strtoupper($row['currency']) => (float) $row['rate']
                ]);

                $amountInINR = (strtoupper($currency) === 'INR')
                    ? $amount
                    : round($amount * ($exchangeRates[strtoupper($currency)] ?? 1), 2);

                Entry::make()
                    ->collection('donation')
                    ->data([
                        'title'           => 'donation_' . Str::uuid(),
                        'donor_name'      => $metadata->donor_id ?? null,
                        'email'           => $metadata->donor_email ?? $email,
                        'pan'             => $metadata->pan ?? null,
                        'phone_number'    => $metadata->donor_phone ?? null,
                        'donation_type'   => $metadata->pay_type ?? 'One Time Funding',
                        'campaign'        => (!isset($metadata->campaign_id) || $metadata->campaign_id === 'null' || $metadata->campaign_id === null || $metadata->campaign_id === '') ? ' - ' : $metadata->campaign_id,
                        'amount'          => $amount,
                        'amount_inr'      => $amountInINR,
                        'currency_name'   => strtoupper($currency),
                        'payment_id'      => $session->payment_intent ?? $subscriptionId,
                        'subscription_id' => $subscriptionId,
                        'date'            => Carbon::now()->toDateTimeString(),
                    ])
                    ->save();

                if ($subscriptionId) {
                    $entry = Entry::query()
                        ->where('collection', 'customer')
                        ->where('email', $email)
                        ->first();

                    if ($entry) {
                        $entry
                            ->set('subscription_id', $subscriptionId)
                            ->set('subscription_status', $subscription->status)
                            ->set('subscription_end_date', Carbon::createFromTimestamp($subscription->cancel_at ?? 0))
                            ->save();
                    }
                }

                if (!empty($metadata->campaign_id)) {
                    $donations = Entry::query()
                        ->where('collection', 'donation')
                        ->where('campaign', $metadata->campaign_id)
                        ->get();

                    $totalRaised = $donations->sum(fn($entry) => (float) $entry->get('amount_inr') ?? 0);
                    $totalContributors = $donations->count();

                    $campaign = Entry::find($metadata->campaign_id);
                    if ($campaign) {
                        $campaign
                            ->set('total_raised_fund', $totalRaised)
                            ->set('total_contributors', $totalContributors)
                            ->save();
                    }
                }
            } catch (\Exception $e) {

            }
        }
    }
    public function getAllSubscriptions()
    {
        $this->setStripeKeyFromGlobals();

        $email = session('customer_email');
        if (!$email) {
            return response()->json(['error' => 'Not logged in'], 401);
        }

        $subscriptions = Entry::query()
            ->where('collection', 'donation')
            ->where('email', $email)
            ->whereNotNull('subscription_id')
            ->get()
            ->keyBy('subscription_id') // ensure unique by sub ID
            ->values(); // reset index

        if ($subscriptions->isEmpty()) {
            return response()->json(['subscriptions' => []]);
        }

        $result = [];

        $globals = GlobalSet::findByHandle('payment_configuration')->inDefaultSite()->data();
        $razorpay = new RazorpayApi($globals->get('razorpay_key'), $globals->get('razorpay_secret'));

        foreach ($subscriptions as $sub) {
            $subscriptionId = $sub->get('subscription_id');

            try {
                if (Str::startsWith($subscriptionId, 'sub_') && strlen($subscriptionId) >= 25) {
                    // 🔵 Stripe
                    $stripeSub = Subscription::retrieve([
                        'id' => $subscriptionId,
                        'expand' => ['items.data.price'],
                    ]);

                    $result[] = [
                        'gateway'           => 'stripe',
                        'subscription_id'   => $subscriptionId,
                        'amount'            => strtoupper($stripeSub->items->data[0]->price->currency ?? 'usd') . ' ' .
                            number_format(($stripeSub->items->data[0]->price->unit_amount ?? 0) / 100, 2),
                        'interval'          => $stripeSub->items->data[0]->price->recurring->interval ? 'monthly' : '—',
                        'status'            => $stripeSub->status,
                        'next_billing_at'   => Carbon::createFromTimestamp($stripeSub->items->data[0]->current_period_end)->format('d M Y'),
                        'auto_pay_enabled'  => !$stripeSub->pause_collection,
                        'cancel_at'         => $stripeSub->canceled_at
                            ? Carbon::createFromTimestamp($stripeSub->canceled_at)->format('d M Y')
                            : null,
                    ];
                } elseif (Str::startsWith($subscriptionId, 'sub_') && strlen($subscriptionId) === 18) {
                    // 🟠 Razorpay
                    $razorSub = $razorpay->subscription->fetch($subscriptionId);
                    $result[] = [
                        'gateway'           => 'razorpay',
                        'subscription_id'   => $razorSub['id'],
                        'amount'            => 'INR ' . number_format($sub->get('amount_inr') ?? 0, 2),
                        'interval'          => 'monthly',
                        'status'            => $razorSub['status'],
                        'next_billing_at'   => $razorSub['charge_at']
                            ? Carbon::createFromTimestamp($razorSub['charge_at'])->format('d M Y')
                            : '—',
                        'auto_pay_enabled'  => $razorSub['status'] === 'active',
                        'cancel_at'         => $razorSub['ended_at']
                            ? Carbon::createFromTimestamp($razorSub['ended_at'])->format('d M Y')
                            : null,
                    ];
                } else {
                    $result[] = [
                        'subscription_id' => $subscriptionId,
                        'error' => 'Unknown subscription gateway or format.',
                    ];
                }
            } catch (\Exception $e) {
                $result[] = [
                    'subscription_id' => $subscriptionId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json(['subscriptions' => $result]);
    }


    // Cancel a specific subscription
    public function cancelSubscription(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $subscriptionId = $request->get('subscription_id');
        if (!$subscriptionId) {
            return response()->json(['error' => 'Subscription ID is required'], 400);
        }

        try {
            Subscription::retrieve($subscriptionId)->cancel();

            $entry = Entry::query()
                ->where('collection', 'donations')
                ->where('subscription_id', $subscriptionId)
                ->first();

            if ($entry) {
                $entry->set('subscription_status', 'canceled')->save();
            }

            return response()->json(['status' => 'Subscription canceled']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cancel failed: ' . $e->getMessage()], 500);
        }
    }

    // Pause a specific subscription
    public function pauseSubscription(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $subscriptionId = $request->get('subscription_id');
        if (!$subscriptionId) {
            return response()->json(['error' => 'Subscription ID is required'], 400);
        }

        try {
            Subscription::update($subscriptionId, [
                'pause_collection' => ['behavior' => 'mark_uncollectible'],
            ]);

            $entry = Entry::query()
                ->where('collection', 'donations')
                ->where('subscription_id', $subscriptionId)
                ->first();

            if ($entry) {
                $entry->set('subscription_status', 'paused')->save();
            }

            return response()->json([
                'status' => 'Subscription paused',
                'subscription_id' => $subscriptionId,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Pause failed: ' . $e->getMessage()], 500);
        }
    }

    // Resume a specific subscription
    public function resumeSubscription(Request $request)
    {
        $this->setStripeKeyFromGlobals();

        $subscriptionId = $request->get('subscription_id');
        if (!$subscriptionId) {
            return response()->json(['error' => 'Subscription ID is required'], 400);
        }

        try {
            Subscription::update($subscriptionId, [
                'pause_collection' => '',
            ]);

            $entry = Entry::query()
                ->where('collection', 'donations')
                ->where('subscription_id', $subscriptionId)
                ->first();

            if ($entry) {
                $entry->set('subscription_status', 'active')->save();
            }

            return response()->json(['status' => 'Subscription resumed']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Resume failed: ' . $e->getMessage()], 500);
        }
    }
}
