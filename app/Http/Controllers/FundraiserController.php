<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use LDAP\Result;
use Statamic\Entries\Entry;
use Statamic\Facades\GlobalSet;
use Illuminate\Support\Carbon;

class FundraiserController extends Controller
{
    public function filterFundraisers(Request $request)
    {
        $query = Entry::query()->where('collection', 'campaigns');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%')
                    ->orWhere('date', 'like', '%' . $search . '%')
                    ->orWhere('categories', 'like', '%' . $search . '%');
            });
        }

        if ($category = $request->input('category')) {
            $category_re = $query->where('categories', $category);
        }

        if ($sort = $request->input('sort')) {
            if ($sort === 'urgent') {
                $sort_re = $query->where(function ($qu) use ($search) {
                    $qu->where('urgent_requirment', true)
                        ->orWhere('admitted', true);
                });
            } elseif (str_contains($sort, ':')) {
                [$field, $direction] = explode(':', $sort);
                $sort_re = $query->orderBy($field, $direction);
            }
        } else {
            $sort_re = $query->orderBy('updated_at', 'desc'); // default sort
        }

        $fundraisers = $query->paginate(8);

        return view('partials.fundraiser-list', compact('fundraisers'));
    }
    public function filter(Request $request)
    {
        $category = $request->category;
        $limit = $request->limit;

        $entries = Entry::query()
            ->where('collection', 'campaigns')
            ->orderByDesc('date');

        if ($category) {
            $entries->where('categories', 'like', '%' . $category . '%');
        }
        $entries->orderBy('updated_at', 'desc');

        $entries = $entries->limit($limit)->get();

        return view('partials.ajax-campaigns', ['entries' => $entries]);
    }
    public function updateCampaignStats(Request $request)
    {
        // Step 1: Load exchange rates from Global Set (format: 1 unit foreign = X INR)
        $gridData = GlobalSet::findByHandle('exchange_rates')
            ->inDefaultSite()
            ->data()
            ->get('currency_rate') ?? [];

        // Step 2: Build exchange rate map
        $exchangeRates = collect($gridData)->mapWithKeys(function ($row) {
            $currency = strtoupper($row['currency']);
            $rate = (float) $row['rate'];

            // If it's INR, rate is 1
            return [$currency => ($currency === 'INR') ? 1 : $rate];
        });

        // Step 3: Load donations for this campaign
        $donations = Entry::query()
            ->where('collection', 'donation')
            ->where('campaign', $request->campaign_id)
            ->get();

        $totalRaisedInINR = 0;

        // Step 4: Convert each donation amount to INR
        foreach ($donations as $entry) {
            $amount = (float) $entry->get('amount');
            $currency = strtoupper($entry->get('currency_name') ?? 'INR');
            $rate = $exchangeRates[$currency] ?? 1;

            $converted = round($amount * $rate, 2);
            $totalRaisedInINR += $converted;
        }

        // Step 5: Count contributors
        $totalContributors = $donations->count();

        // Step 6: Update campaign entry
        $campaign = Entry::find($request->campaign_id);
        if ($campaign) {
            $campaign
                ->set('total_raised_fund', $totalRaisedInINR)
                ->set('total_contributors', $totalContributors)
                ->save();
        }

        // Step 7: Return response
        return response()->json([
            'success' => true,
            'contributors' => $totalContributors,
            'raised_fund' => round($totalRaisedInINR, 2),
        ]);
    }

    public function getMonthlyDonorStats()
    {
        $start = Carbon::now()->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $entries = Entry::query()
            ->where('collection', 'donation')
            ->whereBetween('date', [$start->toDateTimeString(), $end->toDateTimeString()])
            ->get();

        return response()->json(['count' => $entries->count()]);
    }
    public function paymentStatus(Request $request)
    {
        // dd($request->all());
        $sessionId = $request->query('session_id');
        $orderId = $request->query('order_id');


        // dd($orderId);
        if ($sessionId) {
            return (new \Statamic\View\View)
                ->template('partials.thank-you') // Use a full page template, not a partial
                ->layout('layout') // Optional: specify your site layout if not the default
                ->with([
                    'title' => 'Thank You',
                    'status' => 'Payment was Successful',
                ]);
        } elseif ($orderId) {
            return (new \Statamic\View\View)
                ->template('partials.thank-you') // Use a full page template, not a partial
                ->layout('layout') // Optional: specify your site layout if not the default
                ->with([
                    'title' => 'Thank You',
                    'status' => 'Payment was Successful',
                ]);
        } else {
            return redirect('/')->with('error', 'Payment not found.');
        }
    }
}
