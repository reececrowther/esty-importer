import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import path from 'path';
import fs from 'fs/promises';
import { isPackPath, getPackRelativePath } from '@/lib/mockupPacks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    // Security: Prevent directory traversal
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    let fileData: Buffer;
    if (isPackPath(filePath)) {
      // Pack mockups live in public/mockup-packs/ (e.g. pack:vertical-modern-frame/vertical-1.psd)
      const relativePath = getPackRelativePath(filePath);
      const fullPath = path.join(process.cwd(), 'public', 'mockup-packs', relativePath);
      fileData = await fs.readFile(fullPath);
    } else {
      fileData = await storage.read(filePath);
    }
    
    // Determine content type from extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.psd': 'image/vnd.adobe.photoshop',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileData), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('File read error:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    // Security: Prevent directory traversal
    if (filePath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Pack files are read-only (in public/mockup-packs), not deletable via API
    if (isPackPath(filePath)) {
      return NextResponse.json(
        { error: 'Cannot delete mockup pack files' },
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
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
