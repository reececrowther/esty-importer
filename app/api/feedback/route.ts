import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export type FeedbackPayload = {
  rating: number;
  message?: string;
  route: string;
  timestamp: string;
  userAgent?: string;
  allowContact?: boolean;
};

// In-memory store for MVP. Replace with database when scaling.
const feedbackStore: FeedbackPayload[] = [];

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');

function ensureDataDir() {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadFromFile(): FeedbackPayload[] {
  try {
    ensureDataDir();
    if (fs.existsSync(FEEDBACK_FILE)) {
      const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // Ignore read errors; will use in-memory only
  }
  return [];
}

function appendToFile(payload: FeedbackPayload) {
  try {
    ensureDataDir();
    const existing = loadFromFile();
    existing.push(payload);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.error('[feedback] Failed to write to file:', err);
  }
}

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

    // MVP: persist to in-memory + optional JSON file
    feedbackStore.push(payload);
    appendToFile(payload);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[feedback] POST error:', e);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
