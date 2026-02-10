/**
 * Mockup Engine Interface
 * 
 * Defines the contract for any mockup processing engine.
 * This allows swapping between Photopea, custom engines, or future alternatives.
 */

import { DesignImage, MockupPSD, MockupResult } from './index';

export interface MockupEngine {
  /**
   * Process a single mockup by replacing Smart Object in PSD with design image
   */
  processMockup(
    designImage: DesignImage,
    mockupPSD: MockupPSD,
    options?: MockupEngineOptions
  ): Promise<MockupResult>;

  /**
   * Process multiple mockups in sequence
   */
  processMockups(
    designImage: DesignImage,
    mockupPSDs: MockupPSD[],
    options?: MockupEngineOptions
  ): Promise<MockupResult[]>;

  /**
   * Check if the engine is ready to process
   */
  isReady(): boolean;
}

export interface MockupEngineOptions {
  /**
   * Smart Object layer names to try (in order)
   */
  smartObjectLayerNames?: string[];
  
  /**
   * Export format
   */
  exportFormat?: 'jpg' | 'png';
  
  /**
   * Export quality (0-100)
   */
  exportQuality?: number;
  
  /**
   * Export DPI (e.g. 72 for screen, 300 for print).
   * Scales output and sets density metadata. Base is 72 if PSD has no resolution.
   */
  exportDpi?: number;

  /**
   * How the design image fits inside the frame.
   * - 'contain': Fit entirely inside the frame (no overflow; may add letterboxing).
   * - 'cover': Fill the entire frame (may crop design if aspect ratios differ).
   * Default 'contain' avoids overflow; use 'cover' for a full-bleed look.
   */
  imageFit?: 'contain' | 'cover';
  
  /**
   * Additional engine-specific options
   */
  [key: string]: any;
}

export interface MockupEngineComponentProps {
  designImage: DesignImage;
  mockupPSDs: MockupPSD[];
  onComplete: (results: MockupResult[]) => void;
  onProgress?: (current: number, total: number, status: string) => void;
  options?: MockupEngineOptions;
}
