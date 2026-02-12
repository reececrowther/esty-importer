import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserWithUsage } from '@/lib/tiers';
import { getLimitsForTier, TIER_LIMITS } from '@/lib/tierConstants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserWithUsage(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limits = getLimitsForTier(user.tier);
    const isFree = user.tier === 'FREE';

    return NextResponse.json({
      tier: user.tier,
      tools: limits.tools,
      limits: {
        mockupsPerMonth: limits.mockupsPerMonth === Infinity ? null : limits.mockupsPerMonth,
        etsyUploadsPerMonth: limits.etsyUploadsPerMonth === Infinity ? null : limits.etsyUploadsPerMonth,
        listingGensPerMonth: limits.listingGensPerMonth === Infinity ? null : limits.listingGensPerMonth,
      },
      usage: {
        mockupsUsedInPeriod: user.mockupsUsedInPeriod,
        etsyUploadsUsedInPeriod: user.etsyUploadsUsedInPeriod,
        listingGensUsedInPeriod: user.listingGensUsedInPeriod,
      },
      periodKey: user.usagePeriodMonth,
      plusTools: TIER_LIMITS.PLUS.tools,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
