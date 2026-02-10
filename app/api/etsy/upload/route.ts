import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadListingToEtsy } from '@/services/etsyService';
import { EtsyListing } from '@/types';
import {
  ETSY_COOKIE_TOKENS,
  parseTokenCookie,
  refreshEtsyTokens,
} from '@/lib/etsyAuth';
import { checkEtsyUploadLimit, incrementEtsyUploadUsage } from '@/lib/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitCheck = await checkEtsyUploadLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'limit_exceeded',
          message: `Free tier limit reached: ${limitCheck.used}/${limitCheck.limit} Etsy uploads this month. Upgrade to Plus for unlimited uploads.`,
          used: limitCheck.used,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listing, publish } = body as { listing: EtsyListing; publish?: boolean };

    const cookie = request.cookies.get(ETSY_COOKIE_TOKENS)?.value;
    let tokens = parseTokenCookie(cookie);

    const clientId = process.env.ETSY_API_KEY;

    if (tokens && tokens.expiresAt <= Date.now() && clientId && tokens.refreshToken) {
      const refreshed = await refreshEtsyTokens(tokens.refreshToken, clientId);
      if (refreshed) {
        tokens = { ...refreshed, shopId: tokens.shopId };
      }
    }

    const accessToken = tokens?.accessToken;
    const shopId =
      tokens?.shopId ??
      (process.env.ETSY_SHOP_ID ? parseInt(process.env.ETSY_SHOP_ID, 10) : NaN);

    if (!Number.isInteger(shopId) || shopId <= 0) {
      return NextResponse.json(
        { error: 'Etsy store not connected. Connect your Etsy store first.' },
        { status: 401 }
      );
    }

    const result = await uploadListingToEtsy({
      listing,
      accessToken: accessToken ?? undefined,
      shopId,
      publish: Boolean(publish),
    });

    await incrementEtsyUploadUsage(session.user.id);

    const response = NextResponse.json(result);

    if (tokens && tokens !== parseTokenCookie(cookie)) {
      response.cookies.set(ETSY_COOKIE_TOKENS, encodeURIComponent(JSON.stringify(tokens)), {
        path: '/',
        maxAge: 90 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (error) {
    console.error('Etsy upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload to Etsy' },
      { status: 500 }
    );
  }
}
