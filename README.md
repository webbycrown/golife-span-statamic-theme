# Golife Span - Statamic Starter Kit

At GoLife Span, we simplify the process of building beautiful, impactful fundraising websites.
Our theme includes flexible, customizable sections for fundraisers, stories, Donate monthly, news, and more so you can focus on your mission, not the technical details.

## Pages of Metalpeak

- How IT Works Page
- Browse Fundraisers Page
- Donate Monthly Page
- Stories Page
- News Page
- Contact us Page
- Login
- Register
- Single Campaigns Page
- account Page
- 404 Page

## Features of Golife Span

- A rich selection of sets for building your site:
  - Campaigns Section
  - Funding Banner
  - Banner CTA Sction
  - Info Cards Grid
  - Payment Details
  - Similar-Campaigns
  - Service Highlight Section

## Control Panel Forms

  - NewsLetter
  - Contact Us
  - Funding Needed

## Global Settings

  - Footer Setting
  - Header Setting
  - Page 404 Setting
  - Payment Configuration Setting
  - Exchange Rates Setting
  - Common Setting

## Installation

Follow the [Starter Kit installation instructions](https://statamic.dev/starter-kits/installing-a-starter-kit) to get started with Golife Span.
Make sure you're running **Statamic 5.x** for compatibility.

### Installing into an existing site

```bash
php please starter-kit:install webbycrown/golife-span-statamic-theme
```

### Installing via the Statamic CLI Tool

If you have the [Statamic CLI Tool](https://github.com/statamic/cli) installed, create a new Statamic installation with Golife Span in one command:

```bash
statamic new my-site webbycrown/golife-span-statamic-theme
```

### Payment Configuration (via Statamic Globals)

GoLife Span supports Razorpay and Stripe integration, with key management through the Globals section in the Statamic Control Panel.

### How to Set Payment Keys
   - Log in to your Statamic Control Panel: /cp
   - Go to Globals → Payment Settings (or your defined handle, e.g., site/payment)

### Add the following fields if not already defined:

   1. Razorpay
      - razorpay_key – Your Razorpay public key (Key ID)
      - razorpay_secret – Your Razorpay secret key

   2. Stripe
      - stripe_key – Your Stripe publishable key
      - stripe_secret – Your Stripe secret key

    These values are stored securely in Statamic’s content under content/globals/.