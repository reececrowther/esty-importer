import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateListingContent } from '@/services/aiListingService';
import { checkListingGenLimit, incrementListingGenUsage } from '@/lib/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitCheck = await checkListingGenLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'limit_exceeded',
          message: `Free tier limit reached: ${limitCheck.used}/${limitCheck.limit} listing generations this month. Upgrade to Plus for unlimited.`,
          used: limitCheck.used,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      designDescription,
      productType,
      keywords,
      mockupCount,
      imageUrls: rawImageUrls,
    } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const imageUrls =
      Array.isArray(rawImageUrls) && rawImageUrls.length > 0
        ? (rawImageUrls as string[]).map((u: string) =>
            typeof u === 'string' && u.startsWith('/') && baseUrl ? `${baseUrl.replace(/\/$/, '')}${u}` : u
          )
        : undefined;

    const listingContent = await generateListingContent({
      designDescription,
      productType,
      keywords,
      mockupDescriptions: [`${mockupCount} mockup${mockupCount > 1 ? 's' : ''}`],
      imageUrls,
    });

    await incrementListingGenUsage(session.user.id);

    return NextResponse.json(listingContent);
  } catch (error) {
    console.error('Listing generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate listing content';
    return NextResponse.json(
      { error: 'listing_generation_failed', message },
      { status: 500 }
    );
  }
}
