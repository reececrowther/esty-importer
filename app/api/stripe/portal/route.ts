import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so Plus users can manage/cancel subscription.
 * Returns the portal URL. Requires user to have stripeCustomerId (set after first checkout).
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured.' },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, tier: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe to Plus first.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return NextResponse.json(
      { error: 'Failed to open billing portal' },
      { status: 500 }
    );
  }
}
