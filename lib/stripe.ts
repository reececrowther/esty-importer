import Stripe from 'stripe';

/**
 * Server-side Stripe instance. Use for checkout sessions, webhooks, and customer portal.
 * Requires STRIPE_SECRET_KEY in env.
 */
export const stripe =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_')
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

export const STRIPE_PLUS_PRICE_ID = process.env.STRIPE_PLUS_PRICE_ID ?? null;
