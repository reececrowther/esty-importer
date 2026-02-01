'use client';

import { useState, useEffect, useCallback } from 'react';
import { DesignImage, MockupPSD, MockupResult } from '@/types';
import { generateJobId } from '@/services/mockupService';
import { MockupEngineComponentProps, MockupEngineOptions } from '@/types/mockupEngine';

/**
 * Custom Mockup Engine Component
 * 
 * Replace Photopea with your custom mockup processing engine.
 * This component handles the UI and coordination, while the actual
 * processing can happen client-side or via API calls.
 */
export default function CustomMockupEngine({
  designImage,
  mockupPSDs,
  onComplete,
  onProgress,
  options = {},
}: MockupEngineComponentProps) {
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [results, setResults] = useState<MockupResult[]>([]);
  const [status, setStatus] = useState<string>('Initializing custom mockup engine...');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    smartObjectLayerNames = ['YOUR DESIGN HERE', 'Design Here', 'Design'],
    exportFormat = 'jpg',
    exportQuality = 90,
    exportDpi,
  } = options;

  // Get full URLs for files
  const getFileUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/api/files/${path}`;
  };

  useEffect(() => {
    if (mockupPSDs.length > 0 && !isProcessing && currentMockupIndex === 0 && results.length === 0) {
      startProcessing();
    }
  }, [mockupPSDs.length]);

  const startProcessing = async () => {
    setIsProcessing(true);
    setStatus('Starting mockup processing...');
    
    const processedResults: MockupResult[] = [];
    
    // Process mockups sequentially
    for (let i = 0; i < mockupPSDs.length; i++) {
      setCurrentMockupIndex(i);
      const mockupPSD = mockupPSDs[i];
      setStatus(`Processing mockup ${i + 1}/${mockupPSDs.length}: ${mockupPSD.originalName}`);
      
      if (onProgress) {
        onProgress(i + 1, mockupPSDs.length, `Processing ${mockupPSD.originalName}`);
      }

      try {
        const result = await processSingleMockup(designImage, mockupPSD);
        processedResults.push(result);
        setResults([...processedResults]);
      } catch (error) {
        console.error(`Error processing mockup ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus(`Error processing mockup ${i + 1}: ${errorMessage}`);
        
        // If it's a 400 error (validation/configuration issue), stop processing
        if (errorMessage.includes('API error (400)') || errorMessage.includes('Canvas initialization') || errorMessage.includes('Smart Object layer not found')) {
          alert(`Processing stopped: ${errorMessage}\n\nPlease check:\n- Canvas package is installed (npm install canvas)\n- PSD file has a Smart Object layer named "YOUR DESIGN HERE"\n- Files were uploaded successfully`);
          break; // Stop processing remaining mockups
        }
        
        // Continue to next mockup for other errors
      }
    }

    setIsProcessing(false);
    setStatus('Processing complete!');
    onComplete(processedResults);
  };

  const processSingleMockup = async (
    designImage: DesignImage,
    mockupPSD: MockupPSD
  ): Promise<MockupResult> => {
    const designImageUrl = getFileUrl(designImage.path);
    const mockupPSDUrl = getFileUrl(mockupPSD.path);

    // Option 1: Process via API (server-side)
    // This is recommended for custom engines that run on the server
    try {
      const response = await fetch('/api/mockup/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designImagePath: designImage.path,
          mockupPSDPath: mockupPSD.path,
          smartObjectLayerNames,
          exportFormat,
          exportQuality,
          exportDpi,
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = response.statusText;
        let errorDetails: any = null;
        
        // Clone the response to read it as both text and JSON if needed
        const responseClone = response.clone();
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || response.statusText;
          errorDetails = errorData;
          console.error('API error details:', errorData);
          
          // If it's a specific error we can't recover from, throw it
          if (errorData.error === 'Canvas initialization failed' || 
              errorData.error === 'Failed to parse PSD file' ||
              errorData.error === 'Smart Object layer not found') {
            const fullMessage = errorMessage + 
              (errorData.availableLayers ? `\nAvailable layers: ${errorData.availableLayers.slice(0, 5).join(', ')}` : '');
            throw new Error(`API error (${response.status}): ${fullMessage}`);
          }
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await responseClone.text();
            console.error('API error response (text):', text);
            errorMessage = text || response.statusText;
          } catch (e) {
            // Use status text as fallback
            console.error('Could not parse error response');
          }
        }
        
        // For 400 errors, don't fall back - show the error
        if (response.status === 400) {
          throw new Error(`API error (${response.status}): ${errorMessage}`);
        }
        
        // For other errors, fall back to client-side
        throw new Error(`API error: ${errorMessage}`);
      }

      const result = await response.json();
      
      // Check if result has an error (even with 200 status)
      if (result.error) {
        throw new Error(result.error + (result.message ? ': ' + result.message : ''));
      }
      
      return {
        mockupId: generateJobId(),
        mockupName: mockupPSD.originalName,
        exportedImagePath: result.exportedImagePath,
        exportedImageUrl: getFileUrl(result.exportedImagePath),
      };
    } catch (apiError) {
      // If API fails, fall back to client-side processing
      console.warn('API processing failed, falling back to client-side:', apiError);
      return await processClientSide(designImage, mockupPSD, designImageUrl, mockupPSDUrl);
    }
  };

  const processClientSide = async (
    designImage: DesignImage,
    mockupPSD: MockupPSD,
    designImageUrl: string,
    mockupPSDUrl: string
  ): Promise<MockupResult> => {
    // Option 2: Client-side processing
    // Implement your custom mockup processing logic here
    // This could use a library like psd.js, canvas API, or WebAssembly
    
    // Example: Load images and process with Canvas API
    // This is a placeholder - replace with your actual processing logic
    
    return new Promise((resolve, reject) => {
      try {
        // Load design image
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        
        designImg.onload = () => {
          // Load mockup PSD (this would need a PSD parser library)
          // For now, this is a placeholder structure
          
          // TODO: Implement your custom processing logic here
          // Examples:
          // - Use psd.js to parse PSD and find Smart Object layers
          // - Use canvas API to composite images
          // - Use WebAssembly for performance
          // - Call a third-party API
          
          // Placeholder: Create a canvas and composite
          const canvas = document.createElement('canvas');
          canvas.width = designImg.width;
          canvas.height = designImg.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw design image
          ctx.drawImage(designImg, 0, 0);
          
          // Export as blob
          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error('Failed to export canvas'));
                return;
              }

              // Upload the result
              const formData = new FormData();
              formData.append('files', blob, `mockup-${Date.now()}.${exportFormat}`);

              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload API error:', response.status, errorText);
                throw new Error(`Failed to save exported image: ${response.statusText}`);
              }

              const result = await response.json();
              
              if (!result || !result.files || !result.files[0]) {
                console.error('Invalid upload response:', result);
                throw new Error('Invalid response from upload API');
              }
              
              const uploadedFile = result.files[0];

              resolve({
                mockupId: generateJobId(),
                mockupName: mockupPSD.originalName,
                exportedImagePath: uploadedFile.path,
                exportedImageUrl: getFileUrl(uploadedFile.path),
              });
            },
            exportFormat === 'jpg' ? 'image/jpeg' : 'image/png',
            exportQuality / 100
          );
        };
        
        designImg.onerror = () => {
          reject(new Error('Failed to load design image'));
        };
        
        designImg.src = designImageUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
        <p className="text-sm text-gray-900 dark:text-gray-100 font-bold">{status}</p>
        {mockupPSDs.length > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentMockupIndex + 1) / mockupPSDs.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {currentMockupIndex + 1} of {mockupPSDs.length} mockups processed
            </p>
          </div>
        )}
      </div>
      
      {/* Add your custom engine UI here if needed */}
      <div className="border border-gray-300 dark:border-gray-600 rounded p-4 bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Custom Mockup Engine Active
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Processing via {process.env.NEXT_PUBLIC_MOCKUP_ENGINE_TYPE || 'API'}
        </p>
      </div>
    </div>
  );
}
