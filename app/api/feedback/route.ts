import { NextRequest, NextResponse } from 'next/server';
import type { FeedbackPayload } from '@/lib/feedbackStorage';
import { appendFeedbackToFile } from '@/lib/feedbackStorage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rating = typeof body.rating === 'number' ? body.rating : Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be 1–5.' },
        { status: 400 }
      );
    }
    const payload: FeedbackPayload = {
      rating,
      message: typeof body.message === 'string' ? body.message.trim() || undefined : undefined,
      route: typeof body.route === 'string' ? body.route : '/',
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
      userAgent: typeof body.userAgent === 'string' ? body.userAgent : undefined,
      allowContact: Boolean(body.allowContact),
    };

    // MVP: log to console
    console.log('[feedback]', JSON.stringify(payload, null, 2));

    appendFeedbackToFile(payload);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[feedback] POST error:', e);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
