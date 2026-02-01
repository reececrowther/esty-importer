'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { DesignImage, MockupPSD, MockupResult } from '@/types';
import { generateJobId } from '@/services/mockupService';

interface PhotopeaContainerProps {
  designImage: DesignImage;
  mockupPSDs: MockupPSD[];
  onComplete: (results: MockupResult[]) => void;
}

export default function PhotopeaContainer({
  designImage,
  mockupPSDs,
  onComplete,
}: PhotopeaContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [results, setResults] = useState<MockupResult[]>([]);
  const [status, setStatus] = useState<string>('Initializing Photopea...');
  const [isPhotopeaReady, setIsPhotopeaReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get full URLs for files
  const getFileUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/api/files/${path}`;
  };

  const designImageUrl = getFileUrl(designImage.path);
  // Try these in order; different mockup PSDs use different names.
  // You can extend this list later, or make it user-configurable per PSD.
  const smartObjectLayerNames = ['YOUR DESIGN HERE', 'Design Here', 'Design'];

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const photopeaUrl = 'https://www.photopea.com';

    // Load Photopea
    // Note: Some console warnings are expected:
    // - Sandbox warning: allow-scripts + allow-same-origin is required for Photopea
    // - Ad blocker warnings: Harmless, Photopea tries to load ad resources
    // - JSON parse errors: May occur in Photopea's internal code, harmless
    iframe.src = photopeaUrl;

    const handleMessage = async (event: MessageEvent) => {
      // Security: Verify origin
      if (event.origin !== 'https://www.photopea.com') {
        return;
      }

      // Debug: Log all messages from Photopea to understand what we're receiving
      console.log('Photopea message received:', {
        type: typeof event.data,
        data: event.data,
        isString: typeof event.data === 'string',
        isObject: typeof event.data === 'object',
      });

      try {
        // Photopea sends messages via echoToOE as strings
        // Format: "PHOTOPEA_READY" or "PHOTOPEA_RESULT:{json}"
        if (typeof event.data === 'string') {
          if (event.data === 'PHOTOPEA_READY' || event.data.startsWith('PHOTOPEA_READY')) {
            // Script injection confirmed ready
            console.log('Photopea confirmed script is ready');
            // Clear the timeout fallback since Photopea responded
            if ((window as any).photopeaReadyTimeout) {
              clearTimeout((window as any).photopeaReadyTimeout);
              delete (window as any).photopeaReadyTimeout;
            }
            setIsPhotopeaReady(true);
            setStatus('Photopea ready. Starting processing...');
            return;
          }
          
          if (event.data.startsWith('PHOTOPEA_RESULT:')) {
            // Parse the result JSON
            try {
              const jsonStr = event.data.replace('PHOTOPEA_RESULT:', '');
              const result = JSON.parse(jsonStr);
              
              console.log('Photopea result received:', result.success ? 'success' : 'error');
              
              if (result.success && result.data) {
                await handleExportedImage(result.data);
              } else {
                setStatus(`Error: ${result.error || 'Unknown error'}`);
                console.error('Photopea error:', result.error);
                // Continue to next mockup even on error
                setCurrentMockupIndex((prev) => prev + 1);
              }
            } catch (parseError) {
              console.error('Failed to parse Photopea result:', parseError, event.data);
            }
            return;
          }
        }
        
        // Handle debug messages from Photopea
        if (typeof event.data === 'string' && event.data.startsWith('PHOTOPEA_DEBUG:')) {
          const debugMsg = event.data.replace('PHOTOPEA_DEBUG:', '');
          console.log('Photopea debug:', debugMsg);
          return;
        }
        
        // Handle "done" messages from Photopea (file loading completion)
        if (event.data === 'done') {
          console.log('Photopea sent "done" message');
          // Photopea finished processing, but we handle results via echoToOE
          return;
        }
        
        // Ignore other message types - they may be Photopea's internal messages
        // that can cause JSON parse errors in Photopea's own code
      } catch (error) {
        // Handle any JSON parse errors or other message handling errors
        // These are often from Photopea's internal code, not ours
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          // Silently ignore JSON parse errors from Photopea's internal code
          return;
        }
        console.error('Error handling Photopea message:', error);
        // Don't break the flow, just log the error
      }
    };

    window.addEventListener('message', handleMessage);

    // Wait for Photopea to load, then inject our script
    // Photopea is cross-origin, so we can't check contentDocument
    // Instead, wait a bit for Photopea to initialize, then inject script
    let checkCount = 0;
    const maxChecks = 20; // 10 seconds max wait
    
    const checkPhotopeaReady = setInterval(() => {
      checkCount++;
      
      if (iframe.contentWindow) {
        // Wait a bit for Photopea to fully initialize
        if (checkCount >= 3) {
          clearInterval(checkPhotopeaReady);
          setStatus('Photopea loaded. Injecting automation script...');
          
          // Inject our automation script after Photopea has had time to load
          setTimeout(() => {
            injectPhotopeaScript();
          }, 2000);
        }
      }
      
      // Timeout after max checks
      if (checkCount >= maxChecks) {
        clearInterval(checkPhotopeaReady);
        setStatus('Error: Photopea took too long to load');
        console.error('Photopea loading timeout');
      }
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkPhotopeaReady);
    };
  }, []);

  useEffect(() => {
    if (isPhotopeaReady && !isProcessing && currentMockupIndex < mockupPSDs.length) {
      processNextMockup();
    } else if (currentMockupIndex >= mockupPSDs.length && results.length > 0) {
      onComplete(results);
    }
  }, [isPhotopeaReady, currentMockupIndex, mockupPSDs.length, results.length]);

  const injectPhotopeaScript = () => {
    if (!iframeRef.current?.contentWindow) return;

    // Photopea's API: Send JavaScript code as a STRING via postMessage
    // Photopea will execute the string as JavaScript code
    // Reference: https://www.photopea.com/api/
    
    // First, try a simple test script to verify Photopea is ready
    const testScript = `
      try {
        if (typeof app !== 'undefined' && app.echoToOE) {
          app.echoToOE('PHOTOPEA_READY');
        } else {
          // If app is not ready, wait a bit and try again
          setTimeout(function() {
            if (typeof app !== 'undefined' && app.echoToOE) {
              app.echoToOE('PHOTOPEA_READY');
            }
          }, 1000);
        }
      } catch(e) {
        // Silently fail - Photopea might not be ready yet
      }
    `;

    // Send test script first
    try {
      iframeRef.current.contentWindow.postMessage(testScript, '*');
      console.log('Photopea test script injected');
    } catch (error) {
      console.error('Failed to inject Photopea test script:', error);
    }

    // Then inject the main script after a short delay
    setTimeout(() => {
      const scriptCode = `
        // Set up message listener for commands from parent
        window.addEventListener('message', function(event) {
          // Debug: Send message info back to parent
          if (typeof app !== 'undefined' && app.echoToOE) {
            app.echoToOE('PHOTOPEA_DEBUG: Received message type ' + typeof event.data);
          }
          
          if (event.data && typeof event.data === 'object' && event.data.type === 'process-mockup') {
            var data = event.data;
            var psdUrl = data.psdUrl;
            var designImageUrl = data.designImageUrl;
            var smartObjectLayerNames = data.smartObjectLayerNames || ['YOUR DESIGN HERE', 'Design Here', 'Design'];
            
            // Send debug info
            if (typeof app !== 'undefined' && app.echoToOE) {
              app.echoToOE('PHOTOPEA_DEBUG: Starting mockup processing');
            }
            
            try {
              // Load PSD file
              app.open(psdUrl);
              
              // Wait a bit for document to load (app.open might be async)
              setTimeout(function() {
                try {
                  var doc = app.activeDocument;
                  
                  if (!doc) {
                    throw new Error('Failed to load PSD document');
                  }
                  
                  if (typeof app !== 'undefined' && app.echoToOE) {
                    app.echoToOE('PHOTOPEA_DEBUG: PSD loaded, finding Smart Object');
                  }
              
                  // Function to find Smart Object layer recursively
                  function findSmartObjectLayer(layers, name) {
                    for (var i = 0; i < layers.length; i++) {
                      var layer = layers[i];
                      if (layer.name === name && layer.kind === LayerKind.SMARTOBJECT) {
                        return layer;
                      }
                      if (layer.layers && layer.layers.length > 0) {
                        var found = findSmartObjectLayer(layer.layers, name);
                        if (found) return found;
                      }
                    }
                    return null;
                  }
                  
                  // Find the Smart Object layer by trying multiple candidate names
                  var smartObjectLayer = null;
                  for (var n = 0; n < smartObjectLayerNames.length; n++) {
                    var candidate = smartObjectLayerNames[n];
                    var found = findSmartObjectLayer(doc.layers, candidate);
                    if (found) {
                      smartObjectLayer = found;
                      break;
                    }
                  }

                  if (!smartObjectLayer) {
                    throw new Error('Smart Object layer not found. Tried: ' + smartObjectLayerNames.join(', '));
                  }
                  
                  if (typeof app !== 'undefined' && app.echoToOE) {
                    app.echoToOE('PHOTOPEA_DEBUG: Smart Object found, placing design');
                  }
                  
                  // Select the Smart Object layer
                  doc.activeLayer = smartObjectLayer;
                  
                  // Use Place command to replace Smart Object content
                  var desc = new ActionDescriptor();
                  desc.putPath(charIDToTypeID('null'), new File(designImageUrl));
                  executeAction(charIDToTypeID('Plc '), desc, DialogModes.NO);
                  
                  if (typeof app !== 'undefined' && app.echoToOE) {
                    app.echoToOE('PHOTOPEA_DEBUG: Design placed, exporting');
                  }
                  
                  // Export as JPEG
                  var exportOptions = new ExportOptionsSaveForWeb();
                  exportOptions.format = SaveDocumentType.JPEG;
                  exportOptions.quality = 90;
                  
                  // Create temporary file
                  var tempFile = File(Folder.temp + '/mockup_export.jpg');
                  doc.exportDocument(tempFile, ExportType.SAVEFORWEB, exportOptions);
                  
                  // Read file as base64
                  tempFile.open('r');
                  tempFile.encoding = 'BINARY';
                  var fileData = tempFile.read();
                  tempFile.close();
                  tempFile.remove();
                  
                  // Convert to base64
                  var base64 = btoa(fileData);
                  
                  // Send result back to parent using Photopea's echoToOE
                  app.echoToOE('PHOTOPEA_RESULT:' + JSON.stringify({
                    success: true,
                    data: 'data:image/jpeg;base64,' + base64
                  }));
                  
                } catch (error) {
                  // Send error back to parent
                  if (typeof app !== 'undefined' && app.echoToOE) {
                    app.echoToOE('PHOTOPEA_RESULT:' + JSON.stringify({
                      success: false,
                      error: error.toString()
                    }));
                  }
                }
              }, 2000); // Wait 2 seconds for PSD to load
              
            } catch (error) {
              // Send error back to parent
              if (typeof app !== 'undefined' && app.echoToOE) {
                app.echoToOE('PHOTOPEA_RESULT:' + JSON.stringify({
                  success: false,
                  error: 'Failed to open PSD: ' + error.toString()
                }));
              }
            }
          }
        });
        
        // Notify parent that script is ready
        if (typeof app !== 'undefined' && app.echoToOE) {
          app.echoToOE('PHOTOPEA_READY');
        }
      `;

      try {
        iframeRef.current.contentWindow.postMessage(scriptCode, '*');
        console.log('Photopea main script injected successfully');
        setStatus('Waiting for Photopea to confirm script is ready...');
        
        // Fallback: If Photopea doesn't respond within 5 seconds, assume it's ready
        const readyTimeout = setTimeout(() => {
          setIsPhotopeaReady((currentReady) => {
            if (!currentReady) {
              console.warn('Photopea did not send ready confirmation, proceeding anyway');
              setStatus('Photopea ready (timeout fallback). Starting processing...');
              return true;
            }
            return currentReady;
          });
        }, 5000);
        
        // Store timeout ID so we can clear it if Photopea responds
        (window as any).photopeaReadyTimeout = readyTimeout;
      } catch (error) {
        console.error('Failed to inject Photopea main script:', error);
        setStatus('Error: Failed to initialize Photopea automation');
      }
    }, 1000);
  };

  const processNextMockup = useCallback(() => {
    if (currentMockupIndex >= mockupPSDs.length || !iframeRef.current?.contentWindow) {
      return;
    }

    setIsProcessing(true);
    const mockupPSD = mockupPSDs[currentMockupIndex];
    const mockupPSDUrl = getFileUrl(mockupPSD.path);
    
    setStatus(`Processing mockup ${currentMockupIndex + 1}/${mockupPSDs.length}: ${mockupPSD.originalName}`);

    const command = {
      type: 'process-mockup',
      psdUrl: mockupPSDUrl,
      designImageUrl: designImageUrl,
      smartObjectLayerNames,
    };

    console.log('Sending process command to Photopea:', command);

    // Send process command to Photopea
    try {
      iframeRef.current.contentWindow.postMessage(
        command,
        'https://www.photopea.com'
      );
      console.log('Process command sent successfully');
      
      // Add a timeout to detect if Photopea doesn't respond
      setTimeout(() => {
        if (isProcessing) {
          console.warn('Photopea did not respond to process command within 30 seconds');
          setStatus(`Timeout: Photopea did not respond for mockup ${currentMockupIndex + 1}`);
          setIsProcessing(false);
          setCurrentMockupIndex((prev) => prev + 1); // Continue to next mockup
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to send process command:', error);
      setStatus(`Error sending command to Photopea`);
      setIsProcessing(false);
      setCurrentMockupIndex((prev) => prev + 1);
    }
  }, [currentMockupIndex, mockupPSDs, designImageUrl, smartObjectLayerNames, isProcessing]);

  const handleExportedImage = async (imageData: string) => {
    try {
      setIsProcessing(false);
      
      // Convert base64 to blob and upload
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', blob, `mockup-${currentMockupIndex + 1}.jpg`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save exported image');
      }

      const result = await response.json();
      
      if (!result || !result.files || !result.files[0]) {
        throw new Error('Invalid response from upload API');
      }
      
      const uploadedFile = result.files[0];

      const mockupResult: MockupResult = {
        mockupId: generateJobId(),
        mockupName: mockupPSDs[currentMockupIndex].originalName,
        exportedImagePath: uploadedFile.path,
        exportedImageUrl: getFileUrl(uploadedFile.path),
      };

      setResults((prev) => [...prev, mockupResult]);
      setCurrentMockupIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Error saving exported image:', error);
      setStatus(`Error saving mockup ${currentMockupIndex + 1}`);
      setIsProcessing(false);
      setCurrentMockupIndex((prev) => prev + 1); // Continue to next mockup
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded">
        <p className="text-sm text-gray-900 dark:text-gray-100">{status}</p>
        {currentMockupIndex < mockupPSDs.length && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentMockupIndex + 1) / mockupPSDs.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-[600px] border border-gray-300 rounded"
        title="Photopea"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        allow="same-origin"
        // Note: allow-scripts + allow-same-origin is required for Photopea to function
        // but creates a security trade-off. This is acceptable for a trusted third-party service.
      />
    </div>
  );
}
