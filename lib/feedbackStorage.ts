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

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');

function ensureDataDir() {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadFeedbackFromFile(): FeedbackPayload[] {
  try {
    ensureDataDir();
    if (fs.existsSync(FEEDBACK_FILE)) {
      const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

export function appendFeedbackToFile(payload: FeedbackPayload) {
  try {
    ensureDataDir();
    const existing = loadFeedbackFromFile();
    existing.push(payload);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.error('[feedback] Failed to write to file:', err);
  }
}
