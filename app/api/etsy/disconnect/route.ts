import { NextResponse } from 'next/server';
import { ETSY_COOKIE_TOKENS } from '@/lib/etsyAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: clear Etsy token cookie (disconnect store) */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ETSY_COOKIE_TOKENS, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
