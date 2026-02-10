# Stripe setup for Plus tier

This app uses Stripe for the **Plus** subscription tier. Free users can subscribe via Settings; Plus users can manage or cancel via the Stripe Customer Portal.

## 1. Stripe account and keys

1. Create an account at [stripe.com](https://stripe.com) and get your keys from the [Dashboard](https://dashboard.stripe.com/apikeys).
2. Add to `.env`:
   - **STRIPE_SECRET_KEY** — Secret key (e.g. `sk_test_...` for test, `sk_live_...` for production).
   - **STRIPE_PLUS_PRICE_ID** — Price ID for the Plus plan (see below).
   - **STRIPE_WEBHOOK_SECRET** — Webhook signing secret (see Webhooks below).

## 2. Create the Plus product and price

1. In Stripe Dashboard go to **Products** → **Add product**.
2. Name it e.g. "Plus" and add a description.
3. Under **Pricing**, add a price:
   - Recurring (monthly or yearly).
   - Set the amount (e.g. $9.99/month).
4. Save and copy the **Price ID** (starts with `price_...`) into `.env` as **STRIPE_PLUS_PRICE_ID**.

## 3. Webhooks (required for tier updates)

Stripe calls your app when a subscription is created or canceled so the user’s tier can be updated.

1. In Stripe Dashboard go to **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL**:  
   - Local: use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward:  
     `stripe listen --forward-to localhost:3000/api/stripe/webhook`  
   - Production: `https://your-domain.com/api/stripe/webhook`
3. **Events to send**:  
   - `checkout.session.completed`  
   - `customer.subscription.deleted`  
   - `customer.subscription.updated`
4. After creating the endpoint, copy the **Signing secret** (starts with `whsec_...`) into `.env` as **STRIPE_WEBHOOK_SECRET**.

### Local testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the webhook secret printed by the CLI (often different from the Dashboard one) in your local `.env`.

## 4. Database

Schema includes `stripeCustomerId` and `stripeSubscriptionId` on `User`. Apply migrations:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

## 5. Flow summary

- **Upgrade**: User clicks “Subscribe to Plus with Stripe” in Settings → POST `/api/stripe/checkout` → redirect to Stripe Checkout → after payment, Stripe sends `checkout.session.completed` → webhook sets `tier = PLUS` and stores `stripeCustomerId` / `stripeSubscriptionId`.
- **Cancel / downgrade**: User uses “Manage subscription” in Settings → Stripe Customer Portal → cancels → Stripe sends `customer.subscription.deleted` (or `customer.subscription.updated` with status `canceled`) → webhook sets `tier = FREE` and clears `stripeSubscriptionId`.

## 6. Manual Plus (without Stripe)

You can still grant Plus manually (e.g. for test accounts or offline payments):

```bash
npx ts-node -P prisma/tsconfig.json prisma/upgrade-plus.ts user@example.com
```

Without Stripe configured, the Settings page will show an error if the user tries “Subscribe to Plus with Stripe”; “Manage subscription” appears only for users who have already subscribed via Stripe (have `stripeCustomerId`).
