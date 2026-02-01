import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Delete a file from storage by path.
 * POST body: { path: string } — the stored filename (e.g. "uuid.jpg")
 * Use this instead of DELETE /api/files/[...path] to avoid URL encoding issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filePath = typeof body?.path === 'string' ? body.path.trim() : '';

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing or invalid path' },
        { status: 400 }
      );
    }

    // Security: only allow a single filename (no slashes, no traversal)
    if (filePath.includes('/') || filePath.includes('\\') || filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    await storage.delete(filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
