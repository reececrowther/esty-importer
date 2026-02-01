# Custom Mockup Engine Implementation Guide

This guide explains how to implement your custom mockup processing engine.

## Architecture Overview

The application now uses a modular mockup engine system:

```
app/page.tsx
  └─> CustomMockupEngine (component)
      ├─> Tries API processing first (/api/mockup/process)
      └─> Falls back to client-side processing if API fails
```

## Implementation Options

### Option 1: Server-Side Processing (Recommended)

**File**: `app/api/mockup/process/route.ts`

**Advantages**:
- Better performance (server resources)
- Can use Node.js libraries
- No browser limitations
- Better for large files

**Steps**:

1. **Install PSD parsing library**:
```bash
npm install ag-psd
# or
npm install psd
```

2. **Install image processing library**:
```bash
npm install sharp
# or
npm install jimp
# or
npm install canvas
```

3. **Implement processing logic** in `app/api/mockup/process/route.ts`:

```typescript
import { parsePsd } from 'ag-psd';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const { designImagePath, mockupPSDPath, smartObjectLayerNames } = await request.json();
  
  // 1. Read files
  const designImageBuffer = await storage.read(designImagePath);
  const mockupPSDBuffer = await storage.read(mockupPSDPath);
  
  // 2. Parse PSD
  const psd = parsePsd(mockupPSDBuffer);
  
  // 3. Find Smart Object layer
  const smartObjectLayer = findSmartObjectLayer(psd, smartObjectLayerNames);
  
  // 4. Process design image to fit Smart Object bounds
  const processedDesign = await sharp(designImageBuffer)
    .resize(smartObjectLayer.width, smartObjectLayer.height)
    .toBuffer();
  
  // 5. Composite into mockup
  const finalImage = await compositeMockup(psd, smartObjectLayer, processedDesign);
  
  // 6. Export and save
  const exportedBuffer = await sharp(finalImage)
    .jpeg({ quality: 90 })
    .toBuffer();
  
  const savedPath = await storage.save(exportedBuffer, 'mockup.jpg', 'image/jpeg');
  
  return NextResponse.json({ exportedImagePath: savedPath });
}
```

### Option 2: Client-Side Processing

**File**: `components/mockupEngine/CustomMockupEngine.tsx`

**Advantages**:
- No server load
- Real-time processing
- Can use browser APIs

**Steps**:

1. **Install client-side libraries**:
```bash
npm install psd
```

2. **Implement in `processClientSide` method**:

```typescript
import PSD from 'psd';

const processClientSide = async (...) => {
  // 1. Load PSD
  const psd = await PSD.fromURL(mockupPSDUrl);
  await psd.parse();
  
  // 2. Find Smart Object layer
  const smartObjectLayer = findSmartObjectLayer(psd, smartObjectLayerNames);
  
  // 3. Load design image
  const designImg = await loadImage(designImageUrl);
  
  // 4. Create canvas and composite
  const canvas = document.createElement('canvas');
  canvas.width = psd.width;
  canvas.height = psd.height;
  const ctx = canvas.getContext('2d');
  
  // Draw mockup background
  const mockupImage = psd.image.toPng();
  const mockupImg = await loadImage(mockupImage);
  ctx.drawImage(mockupImg, 0, 0);
  
  // Draw design into Smart Object bounds
  ctx.drawImage(
    designImg,
    smartObjectLayer.left,
    smartObjectLayer.top,
    smartObjectLayer.width,
    smartObjectLayer.height
  );
  
  // 5. Export
  canvas.toBlob(async (blob) => {
    // Upload blob...
  }, 'image/jpeg', 0.9);
};
```

### Option 3: External API/Service

If you have an external mockup processing service:

**File**: `app/api/mockup/process/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { designImagePath, mockupPSDPath } = await request.json();
  
  // Read files
  const designImage = await storage.read(designImagePath);
  const mockupPSD = await storage.read(mockupPSDPath);
  
  // Call your external API
  const response = await fetch('https://your-mockup-api.com/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      designImage: designImage.toString('base64'),
      mockupPSD: mockupPSD.toString('base64'),
    }),
  });
  
  const result = await response.json();
  const resultBuffer = Buffer.from(result.image, 'base64');
  
  // Save result
  const savedPath = await storage.save(resultBuffer, 'mockup.jpg', 'image/jpeg');
  
  return NextResponse.json({ exportedImagePath: savedPath });
}
```

## Helper Functions

You'll need to implement these helper functions:

### Find Smart Object Layer

```typescript
function findSmartObjectLayer(
  psd: any,
  layerNames: string[]
): any {
  function searchLayers(layers: any[]): any {
    for (const layer of layers) {
      // Check if this layer matches
      if (layerNames.includes(layer.name) && layer.kind === 'smartObject') {
        return layer;
      }
      // Recursively search child layers
      if (layer.children) {
        const found = searchLayers(layer.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return searchLayers(psd.layers || []);
}
```

### Composite Mockup

```typescript
async function compositeMockup(
  psd: any,
  smartObjectLayer: any,
  designImage: Buffer
): Promise<Buffer> {
  // Implementation depends on your library
  // This is a placeholder structure
  return designImage; // Replace with actual compositing
}
```

## Testing

1. **Test with a simple PSD first** - Use a mockup with a known Smart Object layer name
2. **Check console logs** - The component logs progress and errors
3. **Verify layer names** - Ensure your PSD uses one of the names in `smartObjectLayerNames`

## Troubleshooting

### "Custom mockup engine not implemented" error
- This means the API route returns 501 (Not Implemented)
- Implement the processing logic in `app/api/mockup/process/route.ts`

### "Smart Object layer not found" error
- Check that your PSD has a Smart Object layer
- Verify the layer name matches one in `smartObjectLayerNames`
- Try adding your layer name to the array: `['YOUR LAYER NAME', 'YOUR DESIGN HERE', ...]`

### Performance issues
- Use server-side processing for better performance
- Consider caching processed results
- Optimize image sizes before processing

## Next Steps

1. Choose your implementation approach (server-side recommended)
2. Install required libraries
3. Implement the processing logic
4. Test with your PSD files
5. Adjust Smart Object layer names as needed

## Example Libraries

- **PSD Parsing**: `ag-psd`, `psd`, `psd.js`
- **Image Processing**: `sharp` (Node.js), `jimp` (Node.js), `canvas` (Node.js/browser)
- **WebAssembly**: For high-performance client-side processing
