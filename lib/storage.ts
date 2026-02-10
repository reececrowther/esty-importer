/**
 * Storage abstraction layer
 *
 * - filesystem: local development (./uploads)
 * - vercel_blob: production on Vercel (set BLOB_READ_WRITE_TOKEN)
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'filesystem';
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';

export interface StorageAdapter {
  save(file: Buffer, filename: string, mimeType: string): Promise<string>;
  getUrl(filePath: string): string;
  delete(filePath: string): Promise<void>;
  read(filePath: string): Promise<Buffer>;
}

class FilesystemStorage implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async save(file: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.ensureDirectory(this.basePath);
    
    const fileId = randomUUID();
    const ext = path.extname(filename) || this.getExtensionFromMimeType(mimeType);
    const savedFilename = `${fileId}${ext}`;
    const filePath = path.join(this.basePath, savedFilename);

    await fs.writeFile(filePath, file);
    return savedFilename;
  }

  getUrl(filePath: string): string {
    // For local filesystem, return a relative URL that Next.js can serve
    return `/api/files/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err?.code === 'ENOENT') {
        // File already gone, treat as success
        return;
      }
      console.error('[storage] delete failed:', fullPath, err?.message ?? error);
      throw error;
    }
  }

  async read(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/vnd.adobe.photoshop': '.psd',
    };
    return mimeMap[mimeType] || '.bin';
  }
}

/** Vercel Blob adapter: use on Vercel so uploads persist (no filesystem). */
class VercelBlobStorage implements StorageAdapter {
  private basePath: string;

  constructor() {
    this.basePath = 'esty-importer';
  }

  async save(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const { put } = await import('@vercel/blob');
    const fileId = randomUUID();
    const ext = path.extname(filename) || this.getExtensionFromMimeType(mimeType);
    const pathname = `${this.basePath}/${fileId}${ext}`;
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  getUrl(filePath: string): string {
    return filePath.startsWith('http') ? filePath : `/api/files/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const { del } = await import('@vercel/blob');
    await del(filePath);
  }

  async read(filePath: string): Promise<Buffer> {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Blob read failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/vnd.adobe.photoshop': '.psd',
    };
    return mimeMap[mimeType] || '.bin';
  }
}

let storageAdapter: StorageAdapter;

if (STORAGE_TYPE === 'vercel_blob') {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required when STORAGE_TYPE=vercel_blob');
  }
  storageAdapter = new VercelBlobStorage();
} else if (STORAGE_TYPE === 'filesystem') {
  storageAdapter = new FilesystemStorage(STORAGE_PATH);
} else {
  throw new Error(`Storage type "${STORAGE_TYPE}" not implemented. Use filesystem or vercel_blob.`);
}

export const storage = storageAdapter;
