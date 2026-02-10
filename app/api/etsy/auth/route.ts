import { NextRequest, NextResponse } from 'next/server';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  ETSY_COOKIE_VERIFIER,
  ETSY_COOKIE_STATE,
  ETSY_COOKIE_RETURN_TO,
} from '@/lib/etsyAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
const SCOPES = ['listings_r', 'listings_w', 'shops_r'];

export async function GET(request: NextRequest) {
  const clientId = process.env.ETSY_API_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/etsy/callback`;

  if (!clientId || !redirectUri || redirectUri.includes('undefined')) {
    return NextResponse.json(
      { error: 'Etsy API is not configured. Set ETSY_API_KEY and NEXT_PUBLIC_APP_URL.' },
      { status: 500 }
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  const redirect = NextResponse.redirect(`${ETSY_AUTH_URL}?${params.toString()}`);

  // Store verifier and state in httpOnly cookies (short-lived, 10 min)
  const cookieOpts = { path: '/', maxAge: 600, httpOnly: true, sameSite: 'lax' as const };
  redirect.cookies.set(ETSY_COOKIE_VERIFIER, verifier, { ...cookieOpts, secure: process.env.NODE_ENV === 'production' });
  redirect.cookies.set(ETSY_COOKIE_STATE, state, { ...cookieOpts, secure: process.env.NODE_ENV === 'production' });

  // Optional return path after OAuth (e.g. /dashboard/settings/etsy)
  const returnTo = request.nextUrl.searchParams.get('returnTo');
  if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    redirect.cookies.set(ETSY_COOKIE_RETURN_TO, returnTo, { ...cookieOpts, secure: process.env.NODE_ENV === 'production' });
  }

  return redirect;
}
