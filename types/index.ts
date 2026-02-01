// Core type definitions for the application

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface DesignImage extends UploadedFile {
  type: 'design';
}

export interface MockupPSD extends UploadedFile {
  type: 'mockup';
}

export interface MockupJob {
  id: string;
  designImageId: string;
  mockupPSDIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results?: MockupResult[];
  error?: string;
}

export interface MockupResult {
  mockupId: string;
  mockupName: string;
  exportedImagePath: string;
  exportedImageUrl: string;
}

export interface ListingContent {
  title: string;
  description: string;
  tags: string[];
}

export interface EtsyListing {
  title: string;
  description: string;
  tags: string[];
  images: string[];
  price?: number;
  quantity?: number;
}

// Photopea message types
export interface PhotopeaMessage {
  type: 'load' | 'execute' | 'export' | 'ready' | 'error' | 'complete';
  payload?: any;
}

export interface PhotopeaLoadPayload {
  psdUrl: string;
  designImageUrl: string;
  smartObjectLayerName: string;
}

export interface PhotopeaExportPayload {
  format: 'jpg' | 'png';
  quality?: number;
}

// Re-export mockup engine types for convenience
export * from './mockupEngine';
