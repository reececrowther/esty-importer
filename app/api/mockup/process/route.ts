import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import path from 'path';
import fs from 'fs/promises';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { isPackPath, getPackRelativePath } from '@/lib/mockupPacks';
import { readPsd, initializeCanvas } from 'ag-psd';
import sharp from 'sharp';
import { checkMockupLimit, incrementMockupUsage } from '@/lib/tiers';

// Initialize canvas for Node.js - must be done before reading PSD files
// This ensures node-canvas is properly set up for ag-psd
let canvasInitialized = false;

function ensureCanvasInitialized() {
  if (canvasInitialized) return;

  try {
    // node-canvas is optional (optionalDependencies) — not available on Vercel; use Photopea in-browser
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const canvasModule = require('canvas');
    const { createCanvas } = canvasModule;
    
    if (!createCanvas || typeof createCanvas !== 'function') {
      throw new Error('createCanvas function not found in canvas module. Make sure "canvas" package is installed: npm install canvas');
    }
    
    if (!initializeCanvas || typeof initializeCanvas !== 'function') {
      throw new Error('initializeCanvas function not available from ag-psd');
    }
    
    // Initialize ag-psd with the createCanvas function
    initializeCanvas(createCanvas);
    canvasInitialized = true;
    console.log('Canvas initialized successfully with node-canvas');
    
  } catch (error) {
    console.error('Failed to initialize canvas:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      'Canvas initialization failed. Make sure "canvas" package is installed: npm install canvas\n' +
      'Original error: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Flatten layer tree into a single array in document order
 * Layers are ordered top-to-bottom (first in array = top in Photoshop)
 */
function flattenLayers(layers: any[]): any[] {
  const result: any[] = [];
  
  if (!layers || !Array.isArray(layers)) {
    return result;
  }
  
  for (const layer of layers) {
    // Add the layer itself
    result.push(layer);
    
    // Recursively add child layers (groups)
    if (layer.children && Array.isArray(layer.children)) {
      result.push(...flattenLayers(layer.children));
    }
  }
  
  return result;
}

/**
 * Extract layer mask as a grayscale buffer (for applying to design)
 * Returns null if mask has no image data or is disabled
 */
async function extractMaskBuffer(mask: any): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  if (!mask || mask.disabled) {
    return null;
  }
  const width = (mask.right ?? 0) - (mask.left ?? 0);
  const height = (mask.bottom ?? 0) - (mask.top ?? 0);
  if (width <= 0 || height <= 0) {
    return null;
  }
  try {
    if (mask.canvas) {
      const canvas = mask.canvas as any;
      if (typeof canvas.toBuffer === 'function') {
        const png = canvas.toBuffer('image/png');
        const meta = await sharp(png).metadata();
        const gray = await sharp(png)
          .grayscale()
          .raw()
          .toBuffer({ resolveWithObject: true });
        return { buffer: gray.data, width: gray.info.width, height: gray.info.height };
      }
      if (typeof canvas.getContext === 'function') {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        // Use red channel as grayscale (mask is grayscale)
        const gray = Buffer.alloc(width * height);
        for (let i = 0; i < width * height; i++) {
          gray[i] = imageData.data[i * 4];
        }
        return { buffer: gray, width, height };
      }
    }
    if (mask.imageData && mask.imageData.data) {
      const data = mask.imageData.data;
      const gray = Buffer.alloc(width * height);
      for (let i = 0; i < width * height; i++) {
        gray[i] = data[i * 4] ?? 0;
      }
      return { buffer: gray, width, height };
    }
  } catch (error) {
    console.warn('Failed to extract mask:', error);
  }
  return null;
}

/**
 * Apply a layer mask to a design image (multiply alpha by mask intensity)
 * Mask is grayscale: white = visible, black = hidden
 */
async function applyMaskToDesign(
  designBuffer: Buffer,
  designWidth: number,
  designHeight: number,
  maskData: { buffer: Buffer; width: number; height: number }
): Promise<Buffer> {
  const { buffer: maskBuffer, width: maskWidth, height: maskHeight } = maskData;
  const designRaw = await sharp(designBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const designPixels = designRaw.data;
  const designChannels = designRaw.info.channels ?? 4;

  // Resize mask to exactly design dimensions (1:1 pixel match) to avoid edge bands/artifacts
  let maskPixels: Buffer;
  if (maskWidth === designWidth && maskHeight === designHeight) {
    maskPixels = maskBuffer;
  } else {
    const resized = await sharp(maskBuffer, {
      raw: { width: maskWidth, height: maskHeight, channels: 1 },
    })
      .resize(designWidth, designHeight, { fit: 'fill' })
      .raw()
      .toBuffer();
    maskPixels = resized;
  }

  const len = designWidth * designHeight;
  for (let i = 0; i < len; i++) {
    const alphaIdx = i * designChannels + 3;
    const maskValue = maskPixels[i] ?? 255;
    designPixels[alphaIdx] = Math.round((designPixels[alphaIdx] * maskValue) / 255);
  }

  return await sharp(designPixels, {
    raw: {
      width: designWidth,
      height: designHeight,
      channels: designChannels,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Extract layer canvas as a buffer
 * Returns null if layer has no canvas or is not visible
 */
async function extractLayerCanvas(layer: any): Promise<Buffer | null> {
  if (!layer || layer.hidden) {
    return null;
  }
  
  // Try to get canvas from layer
  if (!layer.canvas) {
    return null;
  }
  
  const canvas = layer.canvas as any;
  
  try {
    // Method 1: Use canvas.toBuffer() if available (node-canvas)
    if (typeof canvas.toBuffer === 'function') {
      return canvas.toBuffer('image/png');
    }
    
    // Method 2: Get ImageData and convert with sharp
    if (typeof canvas.getImageData === 'function' || typeof canvas.getContext === 'function') {
      const ctx = typeof canvas.getContext === 'function' 
        ? canvas.getContext('2d')
        : canvas;
      
      if (ctx && typeof ctx.getImageData === 'function') {
        const width = layer.width || canvas.width || 0;
        const height = layer.height || canvas.height || 0;
        
        if (width > 0 && height > 0) {
          const imageData = ctx.getImageData(0, 0, width, height);
          
          if (imageData && imageData.data) {
            return await sharp(Buffer.from(imageData.data), {
              raw: {
                width: imageData.width,
                height: imageData.height,
                channels: 4,
              },
            })
              .png()
              .toBuffer();
          }
        }
      }
    }
    
    // Method 3: Try to read as data URL
    if (typeof canvas.toDataURL === 'function') {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
  } catch (error) {
    console.warn(`Failed to extract canvas for layer "${layer.name}":`, error);
  }
  
  return null;
}

/**
 * Fallback composite method using the full PSD composite
 * Used when we can't determine layer order
 * Returns the final composite image buffer
 */
async function fallbackCompositeMethod(
  psd: any,
  processedDesign: Buffer,
  bounds: { left: number; top: number; right: number; bottom: number },
  finalWidth: number,
  finalHeight: number
): Promise<Buffer> {
  console.log('Using fallback composite method');
  
  if (!psd.canvas) {
    throw new Error('PSD does not contain composite image. The PSD file may need to be saved with "Maximize Compatibility" enabled in Photoshop.');
  }
  
  const canvas = psd.canvas as any;
  let mockupBase: Buffer;
  
  if (typeof canvas.toBuffer === 'function') {
    mockupBase = canvas.toBuffer('image/png');
  } else if (typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d');
    const width = psd.width || canvas.width || 2000;
    const height = psd.height || canvas.height || 2000;
    const imageData = ctx.getImageData(0, 0, width, height);
    
    mockupBase = await sharp(Buffer.from(imageData.data), {
      raw: {
        width: imageData.width,
        height: imageData.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  } else {
    throw new Error('Cannot extract canvas from PSD');
  }
  
  const mockupMetadata = await sharp(mockupBase).metadata();
  const psdWidth = mockupMetadata.width || psd.width || 2000;
  const psdHeight = mockupMetadata.height || psd.height || 2000;
  
  const compositeLeft = Math.max(0, Math.min(bounds.left, psdWidth - 1));
  const compositeTop = Math.max(0, Math.min(bounds.top, psdHeight - 1));
  const actualDesignWidth = Math.min(finalWidth, psdWidth - compositeLeft);
  const actualDesignHeight = Math.min(finalHeight, psdHeight - compositeTop);
  
  let designToComposite = processedDesign;
  if (actualDesignWidth !== finalWidth || actualDesignHeight !== finalHeight) {
    designToComposite = await sharp(processedDesign)
      .resize(actualDesignWidth, actualDesignHeight, {
        fit: 'cover',
        position: 'center',
        kernel: 'cubic',
      })
      .toBuffer();
  }
  
  return await sharp(mockupBase)
    .composite([
      {
        input: designToComposite,
        left: compositeLeft,
        top: compositeTop,
        blend: 'over',
      },
    ])
    .toBuffer();
}

/**
 * Custom Mockup Processing API
 * 
 * Processes PSD mockups by:
 * 1. Parsing the PSD file
 * 2. Finding the Smart Object layer by name
 * 3. Replacing the Smart Object content with the design image
 * 4. Exporting the final composite
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitCheck = await checkMockupLimit(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'limit_exceeded',
          message: `Free tier limit reached: ${limitCheck.used}/${limitCheck.limit} mockups this month. Upgrade to Plus for unlimited mockups.`,
          used: limitCheck.used,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      designImagePath,
      mockupPSDPath,
      smartObjectLayerNames = ['YOUR DESIGN HERE', 'Design Here', 'Design'],
      exportFormat = 'jpg',
      exportQuality = 90,
      exportDpi,
      imageFit = 'cover', // 'cover' = fill frame (default); 'contain' = fit inside frame (no overflow)
    } = body;

    if (!designImagePath || !mockupPSDPath) {
      return NextResponse.json(
        { error: 'Missing required parameters: designImagePath and mockupPSDPath' },
        { status: 400 }
      );
    }

    // 1. Read files from storage
    let designImageBuffer: Buffer;
    let mockupPSDBuffer: Buffer;
    
    try {
      designImageBuffer = await storage.read(designImagePath);
      console.log('Design image read, size:', designImageBuffer.length);
    } catch (readError) {
      console.error('Failed to read design image:', readError);
      return NextResponse.json(
        { 
          error: 'Failed to read design image',
          message: readError instanceof Error ? readError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }
    
    try {
      if (isPackPath(mockupPSDPath)) {
        const relativePath = getPackRelativePath(mockupPSDPath);
        const fullPath = path.join(process.cwd(), 'public', 'mockup-packs', relativePath);
        mockupPSDBuffer = await fs.readFile(fullPath);
        console.log('Pack PSD file read, size:', mockupPSDBuffer.length);
      } else {
        mockupPSDBuffer = await storage.read(mockupPSDPath);
        console.log('PSD file read, size:', mockupPSDBuffer.length);
      }
    } catch (readError) {
      console.error('Failed to read PSD file:', readError);
      return NextResponse.json(
        { 
          error: 'Failed to read PSD file',
          message: readError instanceof Error ? readError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // 2. Ensure canvas is initialized before parsing PSD
    try {
      ensureCanvasInitialized();
    } catch (initError) {
      console.error('Canvas initialization error:', initError);
      const msg = initError instanceof Error ? initError.message : 'Unknown initialization error';
      return NextResponse.json(
        { 
          error: 'canvas_unavailable',
          message: msg,
          hint: 'Server-side mockup processing needs the "canvas" package built for your Node version. Use Node 18 (nvm use 18, then reinstall), or use the in-browser Photopea editor for mockups.',
        },
        { status: 503 }
      );
    }

    // 3. Parse PSD (read structure and image data)
    let psd;
    try {
      psd = readPsd(mockupPSDBuffer, {
        skipLayerImageData: false, // We need layer data
        skipCompositeImageData: false, // We need the composite image
        skipThumbnail: true, // Skip thumbnail to save memory
      });
    } catch (parseError) {
      console.error('PSD parse error:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse PSD file',
          message: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        },
        { status: 400 }
      );
    }
    
    if (!psd) {
      return NextResponse.json(
        { error: 'Failed to parse PSD file - returned null' },
        { status: 400 }
      );
    }
    
    console.log('PSD parsed successfully. Width:', psd.width, 'Height:', psd.height);
    console.log('PSD has canvas:', !!psd.canvas);
    console.log('PSD children count:', psd.children?.length || 0);

    // 4. Find Smart Object layer
    const smartObjectLayer = findSmartObjectLayer(psd, smartObjectLayerNames);
    
    if (!smartObjectLayer) {
      // Log available layer names for debugging
      const allLayerNames = getAllLayerNames(psd);
      console.log('Available layers:', allLayerNames);
      
      return NextResponse.json(
        { 
          error: 'Smart Object layer not found',
          message: `Tried layer names: ${smartObjectLayerNames.join(', ')}`,
          availableLayers: allLayerNames.slice(0, 20), // First 20 for debugging
        },
        { status: 400 }
      );
    }
    
    console.log('Found Smart Object layer:', {
      name: smartObjectLayer.name,
      left: smartObjectLayer.left,
      top: smartObjectLayer.top,
      width: smartObjectLayer.width,
      height: smartObjectLayer.height,
      bounds: smartObjectLayer.bounds,
      right: smartObjectLayer.right,
      bottom: smartObjectLayer.bottom,
      // Log all properties for debugging
      allProperties: Object.keys(smartObjectLayer).slice(0, 20),
    });

    // 5. Get Smart Object bounds
    // ag-psd provides bounds in various formats - handle all cases
    let bounds: { left: number; top: number; right: number; bottom: number };
    
    // Try bounds object first
    if (smartObjectLayer.bounds && typeof smartObjectLayer.bounds === 'object') {
      bounds = {
        left: smartObjectLayer.bounds.left ?? smartObjectLayer.bounds.x ?? 0,
        top: smartObjectLayer.bounds.top ?? smartObjectLayer.bounds.y ?? 0,
        right: smartObjectLayer.bounds.right ?? (smartObjectLayer.bounds.left ?? 0) + (smartObjectLayer.bounds.width ?? 0),
        bottom: smartObjectLayer.bounds.bottom ?? (smartObjectLayer.bounds.top ?? 0) + (smartObjectLayer.bounds.height ?? 0),
      };
    } 
    // Try individual right/bottom properties
    else if (smartObjectLayer.right !== undefined && smartObjectLayer.bottom !== undefined) {
      bounds = {
        left: smartObjectLayer.left ?? 0,
        top: smartObjectLayer.top ?? 0,
        right: smartObjectLayer.right ?? 0,
        bottom: smartObjectLayer.bottom ?? 0,
      };
    }
    // Calculate from left/top/width/height
    else {
      const left = smartObjectLayer.left ?? smartObjectLayer.x ?? 0;
      const top = smartObjectLayer.top ?? smartObjectLayer.y ?? 0;
      const width = smartObjectLayer.width ?? smartObjectLayer.bounds?.width ?? 0;
      const height = smartObjectLayer.height ?? smartObjectLayer.bounds?.height ?? 0;
      
      bounds = {
        left,
        top,
        right: left + width,
        bottom: top + height,
      };
    }

    // Normalize bounds to integer pixels for pixel-perfect placement (avoids sub-pixel drift)
    const rawWidth = bounds.right - bounds.left;
    const rawHeight = bounds.bottom - bounds.top;
    bounds = {
      left: Math.round(bounds.left),
      top: Math.round(bounds.top),
      right: Math.round(bounds.left) + Math.round(rawWidth),
      bottom: Math.round(bounds.top) + Math.round(rawHeight),
    };
    const smartObjectWidth = bounds.right - bounds.left;
    const smartObjectHeight = bounds.bottom - bounds.top;

    console.log('Calculated bounds (pixel-normalized):', bounds);
    console.log('Smart Object dimensions:', smartObjectWidth, 'x', smartObjectHeight);

    if (smartObjectWidth <= 0 || smartObjectHeight <= 0) {
      // Try to get dimensions from layer canvas/image if available
      let fallbackWidth = 0;
      let fallbackHeight = 0;
      
      if (smartObjectLayer.canvas) {
        const layerCanvas = smartObjectLayer.canvas as any;
        fallbackWidth = layerCanvas.width || psd.width || 0;
        fallbackHeight = layerCanvas.height || psd.height || 0;
      } else if (smartObjectLayer.imageData) {
        fallbackWidth = smartObjectLayer.imageData.width || 0;
        fallbackHeight = smartObjectLayer.imageData.height || 0;
      }
      
      if (fallbackWidth > 0 && fallbackHeight > 0) {
        console.log('Using fallback dimensions from layer canvas:', fallbackWidth, 'x', fallbackHeight);
        bounds = {
          left: bounds.left || 0,
          top: bounds.top || 0,
          right: bounds.left + fallbackWidth,
          bottom: bounds.top + fallbackHeight,
        };
      } else {
        return NextResponse.json(
          { 
            error: 'Invalid Smart Object bounds',
            message: `Layer "${smartObjectLayer.name}" has invalid bounds. Width: ${smartObjectWidth}, Height: ${smartObjectHeight}`,
            layerInfo: {
              left: smartObjectLayer.left,
              top: smartObjectLayer.top,
              width: smartObjectLayer.width,
              height: smartObjectLayer.height,
              bounds: smartObjectLayer.bounds,
            },
          },
          { status: 400 }
        );
      }
    }
    
    // Recalculate after potential fallback
    const finalWidth = bounds.right - bounds.left;
    const finalHeight = bounds.bottom - bounds.top;
    
    if (finalWidth <= 0 || finalHeight <= 0) {
      return NextResponse.json(
        { 
          error: 'Invalid Smart Object bounds after fallback',
          message: `Could not determine valid bounds for layer "${smartObjectLayer.name}"`,
        },
        { status: 400 }
      );
    }

    // Resize with aspect ratio preserved (cover/contain only - never 'fill') to avoid edge distortion
    const resizeOptions = { position: 'center' as const, kernel: 'cubic' as const };

    // 6. Process design image to fit Smart Object bounds exactly (finalWidth x finalHeight)
    // 'cover' = fill frame (may crop); 'contain' = fit inside (may letterbox). Both preserve aspect ratio.
    let processedDesign: Buffer;
    if (imageFit === 'contain') {
      // Resize design to fit inside bounds, then center on a canvas of exact bounds size.
      // Use off-white padding (not transparent) so JPG export doesn't turn letterbox into black bars.
      const fittedBuffer = await sharp(designImageBuffer)
        .resize(finalWidth, finalHeight, { fit: 'contain', ...resizeOptions })
        .ensureAlpha()
        .png()
        .toBuffer();
      const fittedMeta = await sharp(fittedBuffer).metadata();
      const w = fittedMeta.width ?? 0;
      const h = fittedMeta.height ?? 0;
      const left = Math.round((finalWidth - w) / 2);
      const top = Math.round((finalHeight - h) / 2);
      processedDesign = await sharp({
        create: {
          width: finalWidth,
          height: finalHeight,
          channels: 4,
          background: { r: 252, g: 252, b: 252, alpha: 1 },
        },
      })
        .composite([{ input: fittedBuffer, left, top, blend: 'over' }])
        .png()
        .toBuffer();
    } else {
      processedDesign = await sharp(designImageBuffer)
        .resize(finalWidth, finalHeight, {
          fit: 'cover',
          ...resizeOptions,
        })
        .ensureAlpha()
        .toBuffer();
    }
    
    // 6b. Apply layer mask to design if the Smart Object layer has a mask
    // ag-psd reads mask data; we apply it so masked mockups render correctly
    const layerMask = smartObjectLayer.mask ?? smartObjectLayer.realMask;
    if (layerMask) {
      const maskData = await extractMaskBuffer(layerMask);
      if (maskData) {
        try {
          processedDesign = await applyMaskToDesign(
            processedDesign,
            finalWidth,
            finalHeight,
            maskData
          );
          console.log('Applied layer mask to design image');
        } catch (maskError) {
          console.warn('Could not apply layer mask, using unmasked design:', maskError);
        }
      }
    }
    
    console.log('Processed design image size:', finalWidth, 'x', finalHeight);

    // 7. Build composite image respecting layer order
    // We need to render layers in order: layers before Smart Object -> design image -> layers after Smart Object
    const psdWidth = psd.width || 2000;
    const psdHeight = psd.height || 2000;
    
    console.log('PSD dimensions:', psdWidth, 'x', psdHeight);
    
    // Flatten all layers to get them in document order (top to bottom in Photoshop = first to last in array)
    const allLayers = flattenLayers(psd.children || []);
    console.log(`Found ${allLayers.length} total layers`);
    
    // Find the Smart Object layer index in the flattened list
    const smartObjectIndex = allLayers.findIndex(layer => layer === smartObjectLayer);
    
    // Check if we can use layer-by-layer compositing (requires individual layer canvases)
    const canUseLayerCompositing = smartObjectIndex !== -1 && 
                                   allLayers.some(layer => layer.canvas && !layer.hidden);
    
    // Calculate composite position (used in both paths)
    const compositeLeft = Math.max(0, Math.min(Math.round(bounds.left), psdWidth - 1));
    const compositeTop = Math.max(0, Math.min(Math.round(bounds.top), psdHeight - 1));
    const actualDesignWidth = Math.min(finalWidth, psdWidth - compositeLeft);
    const actualDesignHeight = Math.min(finalHeight, psdHeight - compositeTop);
    
    let finalImage: Buffer;
    
    if (canUseLayerCompositing) {
      console.log(`Smart Object layer found at index ${smartObjectIndex} of ${allLayers.length} layers`);
      console.log('Using layer-by-layer compositing to respect layer order');
      
      // Get layers before and after the Smart Object
      const layersBefore = allLayers.slice(0, smartObjectIndex);
      const layersAfter = allLayers.slice(smartObjectIndex + 1);
      
      console.log(`Layers before Smart Object: ${layersBefore.length}, layers after: ${layersAfter.length}`);
      
      // Build base image from layers before Smart Object using Sharp
      const baseComposites: any[] = [];
      
      for (const layer of layersBefore) {
        if (layer.hidden) continue;
        
        const layerBuffer = await extractLayerCanvas(layer);
        if (layerBuffer) {
          const layerLeft = Math.round(layer.left ?? 0);
          const layerTop = Math.round(layer.top ?? 0);
          
          baseComposites.push({
            input: layerBuffer,
            left: layerLeft,
            top: layerTop,
            blend: 'over',
          });
        }
      }
      
      // Create base image - start with transparent or use first layer
      let baseImage: Buffer;
      if (baseComposites.length > 0) {
        // Get dimensions from first layer or use PSD dimensions
        const firstLayerBuffer = baseComposites[0].input;
        const firstLayerMeta = await sharp(firstLayerBuffer).metadata();
        const baseWidth = Math.max(psdWidth, (baseComposites[0].left || 0) + (firstLayerMeta.width || 0));
        const baseHeight = Math.max(psdHeight, (baseComposites[0].top || 0) + (firstLayerMeta.height || 0));
        
        // Create transparent base
        baseImage = await sharp({
          create: {
            width: baseWidth,
            height: baseHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite(baseComposites)
          .png()
          .toBuffer();
      } else {
        // No layers before, create transparent base
        baseImage = await sharp({
          create: {
            width: psdWidth,
            height: psdHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .png()
          .toBuffer();
      }
      
      console.log('Composite position:', compositeLeft, compositeTop);
      console.log('Actual design size:', actualDesignWidth, 'x', actualDesignHeight);
      
      // If design extends past canvas, scale down to visible area (preserve fit behavior)
      let designToComposite = processedDesign;
      if (actualDesignWidth !== finalWidth || actualDesignHeight !== finalHeight) {
        designToComposite = await sharp(processedDesign)
          .resize(actualDesignWidth, actualDesignHeight, {
            fit: imageFit === 'contain' ? 'contain' : 'cover',
            ...resizeOptions,
          })
          .toBuffer();
      }
      
      // Build composite array: design + layers after
      const compositeLayers: any[] = [
        {
          input: designToComposite,
          left: compositeLeft,
          top: compositeTop,
          blend: 'over',
        },
      ];
      
      // Add layers after Smart Object
      for (const layer of layersAfter) {
        if (layer.hidden) continue;
        
        const layerBuffer = await extractLayerCanvas(layer);
        if (layerBuffer) {
          const layerLeft = Math.round(layer.left ?? 0);
          const layerTop = Math.round(layer.top ?? 0);
          
          compositeLayers.push({
            input: layerBuffer,
            left: layerLeft,
            top: layerTop,
            blend: 'over',
          });
        }
      }
      
      console.log(`Compositing ${compositeLayers.length} layers (1 design + ${compositeLayers.length - 1} layers after)`);
      
      // Composite everything together
      finalImage = await sharp(baseImage)
        .composite(compositeLayers)
        .toBuffer();
    } else {
      console.warn('Cannot use layer-by-layer compositing, falling back to simple composite');
      // Fallback: use the composite image and place design on top
      // This may result in design appearing above layers that should be on top
      finalImage = await fallbackCompositeMethod(psd, processedDesign, bounds, finalWidth, finalHeight);
    }
    
    // Verify final image
    const finalMetadata = await sharp(finalImage).metadata();
    console.log('Final image dimensions:', finalMetadata.width, 'x', finalMetadata.height);

    // 8.5. Optional: scale and set DPI for export
    const baseDpi = 72; // PSD default when resolution not specified
    const targetDpi = typeof exportDpi === 'number' && exportDpi > 0 ? exportDpi : baseDpi;
    const scale = targetDpi / baseDpi;

    let imageToExport = sharp(finalImage);
    if (scale !== 1) {
      const w = finalMetadata.width || psdWidth;
      const h = finalMetadata.height || psdHeight;
      const newWidth = Math.round(w * scale);
      const newHeight = Math.round(h * scale);
      console.log(`Scaling for ${targetDpi} DPI: ${w}x${h} -> ${newWidth}x${newHeight}`);
      imageToExport = imageToExport.resize(newWidth, newHeight, { fit: 'fill' });
    }
    imageToExport = imageToExport.withMetadata({ density: targetDpi });

    // 9. Export with specified format and quality
    let exportedBuffer: Buffer;
    const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';

    if (exportFormat === 'jpg') {
      exportedBuffer = await imageToExport
        .jpeg({ quality: exportQuality })
        .toBuffer();
    } else {
      exportedBuffer = await imageToExport
        .png({ quality: exportQuality })
        .toBuffer();
    }

    // 10. Save to storage
    const filename = `mockup-${Date.now()}.${exportFormat}`;
    const savedPath = await storage.save(
      exportedBuffer,
      filename,
      mimeType
    );

    // Optional: delete source files after successful mockup (saves disk space)
    // Set CLEANUP_SOURCE_AFTER_MOCKUP=true if you don't need to reuse the same design/PSD.
    // Leave unset/false if you use one design with multiple PSDs in the same session.
    // Never delete pack mockups (they live in public/mockup-packs).
    if (process.env.CLEANUP_SOURCE_AFTER_MOCKUP === 'true') {
      await storage.delete(designImagePath).catch(() => {});
      if (!isPackPath(mockupPSDPath)) {
        await storage.delete(mockupPSDPath).catch(() => {});
      }
    }

    // Log success and increment usage for free tier
    console.log('Mockup processing completed successfully');
    console.log('Saved to:', savedPath);
    await incrementMockupUsage(session!.user!.id);

    return NextResponse.json({
      exportedImagePath: savedPath,
      debug: {
        smartObjectBounds: bounds,
        compositePosition: { left: compositeLeft, top: compositeTop },
        designSize: { width: actualDesignWidth, height: actualDesignHeight },
        psdDimensions: { width: psdWidth, height: psdHeight },
      },
    });
  } catch (error) {
    console.error('Mockup processing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: 'Failed to process mockup',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Find Smart Object layer by name
 * Searches recursively through all layers and groups
 * 
 * ag-psd structure:
 * - psd.children: array of layers
 * - layer.name: layer name
 * - layer.placedLayer: indicates a placed layer (Smart Object)
 * - layer.left, layer.top, layer.width, layer.height: layer bounds
 * - layer.bounds: { left, top, right, bottom }
 */
function findSmartObjectLayer(
  psd: any,
  layerNames: string[]
): any {
  function searchLayers(layers: any[]): any {
    if (!layers || !Array.isArray(layers)) {
      return null;
    }

    for (const layer of layers) {
      // Skip hidden layers
      if (layer.hidden) {
        continue;
      }

      // Check if this layer matches one of the target names
      const layerName = (layer.name || '').trim();
      const normalizedLayerName = layerName.toLowerCase();
      
      // Check if name matches (case-insensitive)
      const nameMatches = layerNames.some(name => 
        normalizedLayerName === name.toLowerCase().trim()
      );

      // Check if it's a Smart Object
      // In ag-psd, Smart Objects are typically placed layers
      const isSmartObject = layer.placedLayer === true || 
                           layer.placedLayerId !== undefined ||
                           layer.smartObject !== undefined;

      if (nameMatches) {
        // If name matches, return it even if not explicitly a Smart Object
        // (some PSDs may not mark them correctly, so we trust the layer name)
        // We'll use any layer that matches the name, as it's likely the design placeholder
        console.log(`Found matching layer "${layer.name}" - isSmartObject: ${isSmartObject}, returning it`);
        return layer;
      }

      // Recursively search child layers (groups)
      if (layer.children && Array.isArray(layer.children)) {
        const found = searchLayers(layer.children);
        if (found) return found;
      }
    }
    return null;
  }

  // Start search from root layers
  const layers = psd.children || [];
  return searchLayers(layers);
}

/**
 * Get all layer names for debugging
 */
function getAllLayerNames(psd: any): string[] {
  const names: string[] = [];
  
  function collectNames(layers: any[]) {
    if (!layers || !Array.isArray(layers)) return;
    
    for (const layer of layers) {
      if (layer.name) {
        names.push(layer.name);
      }
      if (layer.children && Array.isArray(layer.children)) {
        collectNames(layer.children);
      }
    }
  }
  
  const layers = psd.children || [];
  collectNames(layers);
  return names;
}