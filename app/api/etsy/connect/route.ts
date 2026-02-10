import { NextRequest, NextResponse } from 'next/server';
import { ETSY_COOKIE_TOKENS, parseTokenCookie } from '@/lib/etsyAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: return whether Etsy is connected and optional shop_id */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(ETSY_COOKIE_TOKENS)?.value;
  const tokens = parseTokenCookie(cookie);

  if (!tokens) {
    return NextResponse.json({ connected: false });
  }

  const isExpired = tokens.expiresAt <= Date.now();
  return NextResponse.json({
    connected: !isExpired,
    shopId: tokens.shopId ?? null,
    expired: isExpired,
  });
}
