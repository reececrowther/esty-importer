import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_PLUS_PRICE_ID } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the Plus subscription and returns the session URL.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!stripe || !STRIPE_PLUS_PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PLUS_PRICE_ID.' },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PLUS_PRICE_ID,
          quantity: 1,
        },
      ],
      client_reference_id: session.user.id,
      customer_email: session.user.email,
      success_url: `${baseUrl}/dashboard/settings?upgrade=success`,
      cancel_url: `${baseUrl}/dashboard/settings?upgrade=cancelled`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: 'Failed to start checkout' },
      { status: 500 }
    );
  }
}
