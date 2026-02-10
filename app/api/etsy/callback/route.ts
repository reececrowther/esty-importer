import { NextRequest, NextResponse } from 'next/server';
import {
  ETSY_COOKIE_VERIFIER,
  ETSY_COOKIE_STATE,
  ETSY_COOKIE_TOKENS,
  ETSY_COOKIE_RETURN_TO,
  parseTokenCookie,
  type EtsyTokenPayload,
} from '@/lib/etsyAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const ETSY_API_BASE = 'https://api.etsy.com/v3';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  const baseUrl = appUrl.replace(/\/$/, '');
  const redirectFail = () => NextResponse.redirect(`${appUrl}?etsy=error`);
  const redirectOk = (tokens: EtsyTokenPayload, returnTo?: string | null) => {
    const destination = returnTo ? `${baseUrl}${returnTo}?etsy=connected` : `${appUrl}?etsy=connected`;
    const res = NextResponse.redirect(destination);
    const value = encodeURIComponent(JSON.stringify(tokens));
    res.cookies.set(ETSY_COOKIE_TOKENS, value, {
      path: '/',
      maxAge: 90 * 24 * 60 * 60, // 90 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    // Clear OAuth flow cookies
    res.cookies.delete(ETSY_COOKIE_VERIFIER);
    res.cookies.delete(ETSY_COOKIE_STATE);
    if (returnTo) res.cookies.delete(ETSY_COOKIE_RETURN_TO);
    return res;
  };

  if (error || !code || !state) {
    return redirectFail();
  }

  const savedState = request.cookies.get(ETSY_COOKIE_STATE)?.value;
  const verifier = request.cookies.get(ETSY_COOKIE_VERIFIER)?.value;

  if (!savedState || savedState !== state || !verifier) {
    return redirectFail();
  }

  const clientId = process.env.ETSY_API_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/etsy/callback`;

  if (!clientId || !redirectUri) {
    return redirectFail();
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  });

  let tokenRes: Response;
  try {
    tokenRes = await fetch(ETSY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (e) {
    console.error('Etsy token exchange error:', e);
    return redirectFail();
  }

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error('Etsy token response:', tokenRes.status, text);
    return redirectFail();
  }

  const data = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  // user_id is the numeric prefix of the access_token (e.g. "12345678.xxx")
  const userId = accessToken.includes('.') ? accessToken.split('.')[0] : null;
  let shopId: number | undefined;

  if (userId) {
    try {
      const shopsRes = await fetch(`${ETSY_API_BASE}/application/users/${userId}/shops`, {
        headers: {
          'x-api-key': clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (shopsRes.ok) {
        const shopsData = (await shopsRes.json()) as { count?: number; results?: Array<{ shop_id: number }> };
        const first = shopsData.results?.[0] ?? (shopsData as { shop_id?: number }).shop_id;
        if (typeof first === 'object' && first?.shop_id) shopId = first.shop_id;
        else if (typeof first === 'number') shopId = first;
      }
    } catch (e) {
      console.warn('Could not fetch user shops:', e);
    }
  }

  // Fallback to env if API didn't return a shop
  if (shopId == null && process.env.ETSY_SHOP_ID) {
    shopId = parseInt(process.env.ETSY_SHOP_ID, 10);
    if (Number.isNaN(shopId)) shopId = undefined;
  }

  const payload: EtsyTokenPayload = {
    accessToken,
    refreshToken,
    expiresAt,
    shopId,
  };

  const returnTo = request.cookies.get(ETSY_COOKIE_RETURN_TO)?.value ?? null;
  return redirectOk(payload, returnTo);
}
