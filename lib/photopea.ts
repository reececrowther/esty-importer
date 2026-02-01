/**
 * Photopea Integration Library
 * 
 * Handles communication with Photopea via postMessage API.
 * Photopea exposes a specific API for automation.
 * 
 * Documentation: https://www.photopea.com/api/
 */

export interface PhotopeaCommand {
  action: string;
  [key: string]: any;
}

/**
 * Send a command to Photopea iframe
 */
export function sendPhotopeaCommand(
  iframe: HTMLIFrameElement,
  command: PhotopeaCommand
): void {
  iframe.contentWindow?.postMessage(
    {
      ...command,
      _type: 'photopea',
    },
    'https://www.photopea.com'
  );
}

/**
 * Load a PSD file into Photopea
 */
export function loadPSD(iframe: HTMLIFrameElement, psdUrl: string): void {
  sendPhotopeaCommand(iframe, {
    action: 'open',
    url: psdUrl,
  });
}

/**
 * Load an image file into Photopea
 */
export function loadImage(iframe: HTMLIFrameElement, imageUrl: string): void {
  sendPhotopeaCommand(iframe, {
    action: 'open',
    url: imageUrl,
  });
}

/**
 * Find a layer by name
 */
export function findLayerByName(
  iframe: HTMLIFrameElement,
  layerName: string
): void {
  sendPhotopeaCommand(iframe, {
    action: 'selectLayer',
    name: layerName,
  });
}

/**
 * Replace Smart Object contents
 * 
 * Note: This is a simplified approach. Actual implementation may require
 * opening the Smart Object, pasting the new image, and saving.
 */
export function replaceSmartObject(
  iframe: HTMLIFrameElement,
  imageUrl: string
): void {
  // Load the replacement image
  loadImage(iframe, imageUrl);
  
  // Wait for image to load, then select all, copy, close
  // Then paste into Smart Object
  // This is a multi-step process that requires coordination
}

/**
 * Export document as JPEG
 */
export function exportAsJPEG(
  iframe: HTMLIFrameElement,
  quality: number = 90
): void {
  sendPhotopeaCommand(iframe, {
    action: 'export',
    format: 'jpg',
    quality: quality,
  });
}

/**
 * Execute a Photopea script
 * 
 * Photopea supports running scripts via app.activeDocument.executeAction
 * or by sending script code directly.
 */
export function executeScript(
  iframe: HTMLIFrameElement,
  script: string
): void {
  sendPhotopeaCommand(iframe, {
    action: 'script',
    code: script,
  });
}

/**
 * Generate a script to replace Smart Object with design image
 */
export function generateReplacementScript(
  designImageUrl: string,
  smartObjectLayerName: string = 'Design'
): string {
  return `
    (function() {
      try {
        var doc = app.activeDocument;
        
        // Find Smart Object layer
        var targetLayer = null;
        function findLayer(layers, name) {
          for (var i = 0; i < layers.length; i++) {
            if (layers[i].name === name && layers[i].kind === LayerKind.SMARTOBJECT) {
              return layers[i];
            }
            if (layers[i].layers && layers[i].layers.length > 0) {
              var found = findLayer(layers[i].layers, name);
              if (found) return found;
            }
          }
          return null;
        }
        
        targetLayer = findLayer(doc.layers, '${smartObjectLayerName}');
        
        if (!targetLayer) {
          throw new Error('Smart Object layer "${smartObjectLayerName}" not found');
        }
        
        // Select the layer
        doc.activeLayer = targetLayer;
        
        // Load design image
        var designFile = new File('${designImageUrl}');
        app.open(designFile);
        var designDoc = app.activeDocument;
        
        // Select all and copy
        designDoc.selection.selectAll();
        designDoc.selection.copy();
        designDoc.close();
        
        // Go back to original document and paste into Smart Object
        doc.activeLayer = targetLayer;
        // Note: Actual Smart Object replacement may require different approach
        // This is a simplified version
        
        // Export as JPEG
        var exportOptions = new ExportOptionsSaveForWeb();
        exportOptions.format = SaveDocumentType.JPEG;
        exportOptions.quality = 90;
        
        var tempFile = new File(Folder.temp + '/export.jpg');
        doc.exportDocument(tempFile, ExportType.SAVEFORWEB, exportOptions);
        
        // Read file and return base64
        tempFile.open('r');
        var data = tempFile.read();
        tempFile.close();
        tempFile.remove();
        
        return btoa(data);
        
      } catch (e) {
        throw new Error('Script error: ' + e.message);
      }
    })();
  `;
}
