import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { DesignImage, MockupPSD } from '@/types';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Support both 'files' (multiple) and 'file' (single) for compatibility with Photopea export and other clients
    let fileList = formData.getAll('files') as File[];
    if (!fileList.length) {
      const single = formData.get('file');
      if (single instanceof File) fileList = [single];
    }
    const files = fileList;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles: (DesignImage | MockupPSD)[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine file type
      const isPSD = file.name.toLowerCase().endsWith('.psd') ||
        file.type === 'image/vnd.adobe.photoshop';

      const savedPath = await storage.save(
        buffer,
        file.name,
        file.type || (isPSD ? 'image/vnd.adobe.photoshop' : 'image/jpeg')
      );

      const uploadedFile: DesignImage | MockupPSD = {
        id: randomUUID(),
        filename: savedPath,
        originalName: file.name,
        path: savedPath,
        size: file.size,
        mimeType: file.type || (isPSD ? 'image/vnd.adobe.photoshop' : 'image/jpeg'),
        uploadedAt: new Date(),
        type: isPSD ? 'mockup' : 'design',
      };

      uploadedFiles.push(uploadedFile);
    }

    return NextResponse.json({
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
