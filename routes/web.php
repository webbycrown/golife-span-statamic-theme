<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\FundraiserController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\NewsletterController;
use Statamic\Facades\Site;


Route::get('/newsletter-check', [NewsletterController::class, 'newsLetter']);

Route::get('/payment-status', [FundraiserController::class, 'paymentStatus'])->name('payment.status');

// ✅ Razorpay 
Route::post('/create-razorpay-order', [RazorpayController::class, 'createOrder']);

Route::post('/create-razorpay-subscription', [RazorpayController::class, 'createSubscriptionDynamic']);

Route::post('/validate-donation', [RazorpayController::class, 'validateDonation']);

// Razorpay - Pause/Resume/Cancel subscription
Route::post('/razorpay/pause-subscription', [RazorpayController::class, 'pauseSubscription']);
Route::post('/razorpay/resume-subscription', [RazorpayController::class, 'resumeSubscription']);
Route::post('/razorpay/cancel-subscription', [RazorpayController::class, 'cancelSubscription']);



// ✅ Stripe routes


Route::post('/create-stripe-session', [StripeController::class, 'createOneTimeStripeSession']);
Route::post('/create-monthly-subscription', [StripeController::class, 'createMonthlySubscription']);

Route::withoutMiddleware(['web'])->group(function () {
    Route::POST('/stripe/webhook', [StripeController::class, 'handleWebhook']);
    Route::post('/razorpay/webhook', [RazorpayController::class, 'handleWebhook']);
});

// Cancel / Pause / Resume Subscription

Route::post('/stripe/pause-subscription', [StripeController::class, 'pauseSubscription'])->name('stripe.pause');
Route::post('/stripe/resume-subscription', [StripeController::class, 'resumeSubscription'])->name('stripe.resume');
Route::post('/stripe/cancel-subscription', [StripeController::class, 'cancelSubscription'])->name('stripe.cancel');

Route::get('/stripe/subscriptions', [StripeController::class, 'getAllSubscriptions']);

Site::all()->each(function ($site) {
    Route::prefix($site->url())
        ->group(function () {
            Route::statamic('/reset-password', 'reset-password'); // points to resources/views/reset-password.antlers.html
        });
});


Route::post('/forgot-password', [CustomerAuthController::class, 'sendResetLink']);
Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword']);
// Route::get('/reset-password', [CustomerAuthController::class, 'showResetForm']);

// Razorpay
Route::post('/razorpay/pause-subscription', [RazorpayController::class, 'pauseSubscription']);
Route::post('/razorpay/resume-subscription', [RazorpayController::class, 'resumeSubscription']);
Route::post('/razorpay/cancel-subscription', [RazorpayController::class, 'cancelSubscription']);

// Stripe
Route::post('/stripe/pause-subscription', [StripeController::class, 'pauseSubscription']);
Route::post('/stripe/resume-subscription', [StripeController::class, 'resumeSubscription']);
Route::post('/stripe/cancel-subscription', [StripeController::class, 'cancelSubscription']);

/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------


/*
|--------------------------------------------------------------------------
| Fundraiser/Campaign Routes
|--------------------------------------------------------------------------
*/

Route::get('/filter-fundraisers', [FundraiserController::class, 'filterFundraisers']);
Route::get('/ajax/campaign', [FundraiserController::class, 'filter']);
Route::post('/ajax/update-campaign-stats', [FundraiserController::class, 'updateCampaignStats']);

/*
|--------------------------------------------------------------------------
| Statistics Routes
|--------------------------------------------------------------------------
*/

Route::get('/monthly-donor-stats', [FundraiserController::class, 'getMonthlyDonorStats']);

/*
|--------------------------------------------------------------------------
| Comment Routes
|--------------------------------------------------------------------------
*/

Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');

Route::get('/comments/render/{id}', function ($id) {
    $page = request()->get('page', 1);
    return view('partials.comments-wrapper', ['id' => $id, 'page' => $page]);
});

/*
|--------------------------------------------------------------------------
| Customer Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post('/customer/register', [CustomerAuthController::class, 'register'])->name('customer.register');
Route::post('/customer/login', [CustomerAuthController::class, 'login'])->name('customer.login');
Route::get('/customer/logout', [CustomerAuthController::class, 'logout'])->name('customer.logout');

/*
|--------------------------------------------------------------------------
| Customer Profile Routes
|--------------------------------------------------------------------------
*/

Route::post('/customer/update', [CustomerController::class, 'update'])->name('customer.update');
Route::post('/update-profile-image', [CustomerController::class, 'updateImage'])->name('customer.updateProfileImage');
