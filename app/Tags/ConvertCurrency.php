<?php

namespace App\Tags;

use Statamic\Tags\Tags;
use Statamic\Facades\GlobalSet;
use Illuminate\Contracts\Session\Session;

class ConvertCurrency extends Tags
{
    public function index()
    {
        $amountInINR = floatval($this->params->get('from'));

        // If amount is 0 or negative, return default
        if ($amountInINR <= 0) {
            return $this->parse([
                'amount'    => '0.00',
                'currency'  => session('selected_currency', 'INR'),
                'symbol'    => '',
                'formatted' => '0.00',
            ]);
        }

        $selectedCurrency = session('selected_currency', 'INR');

        $rates = GlobalSet::findByHandle('exchange_rates')
            ->inDefaultSite()
            ->data()
            ->get('currency_rate') ?? [];

        $rateMap = collect($rates)->mapWithKeys(function ($item) {
            return [$item['currency'] => [
                'rate' => floatval($item['rate']),
                'symbol' => $item['symbols'] ?? '',
            ]];
        });

        if (!isset($rateMap[$selectedCurrency]) || $rateMap[$selectedCurrency]['rate'] <= 0) {
            $selectedCurrency = 'INR';
        }

        $rate = $rateMap[$selectedCurrency]['rate'] ?? 1;
        $symbol = $rateMap[$selectedCurrency]['symbol'] ?? '';
        $convertedAmount = $amountInINR / $rate;

        return $this->parse([
            'amount'    => number_format($convertedAmount, 2),
            'currency'  => $selectedCurrency,
            'symbol'    => $symbol,
            'formatted' => $symbol . " " . number_format($convertedAmount, 2),
        ]);
    }
}
