<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Statamic\Facades\GlobalSet;
use Symfony\Component\HttpFoundation\Response;
use Stripe\Webhook;

class VerifyStripeSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $globals = GlobalSet::findByHandle('payment_configuration')->inDefaultSite()->data();
        $secret = $globals->get('stripe_webhook_secret');

        if (!$secret) {
            Log::error('Stripe webhook secret missing in Global Set.');
            return response()->json(['error' => 'Webhook secret missing'], 500);
        }

        $signature = $request->header('Stripe-Signature');
        $payload = $request->getContent();

        try {
            Webhook::constructEvent($payload, $signature, $secret);
        } catch (\Exception $e) {
            Log::error('Stripe signature verification failed: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        return $next($request);
    }
}
