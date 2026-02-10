import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Stripe webhook handler. Verify signature with STRIPE_WEBHOOK_SECRET.
 * - checkout.session.completed: set user tier to PLUS, store customer + subscription id
 * - customer.subscription.deleted / updated (canceled): set user tier to FREE, clear subscription id
 */
export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe or webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (!userId) {
          console.warn('checkout.session.completed: no client_reference_id');
          break;
        }

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id;
        const customerId =
          typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer | null)?.id;

        if (!subscriptionId) {
          console.warn('checkout.session.completed: no subscription id');
          break;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: 'PLUS',
            stripeCustomerId: customerId ?? undefined,
            stripeSubscriptionId: subscriptionId,
          },
        });
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (event.type === 'customer.subscription.updated' && subscription.status !== 'canceled' && subscription.status !== 'unpaid') {
          break;
        }
        if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              tier: 'FREE',
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
