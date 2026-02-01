'use client';

import { useState } from 'react';
import FileUpload from '@/components/ui/FileUpload';
import CustomMockupEngine from '@/components/mockupEngine/CustomMockupEngine';
// import PhotopeaContainer from '@/components/photopea/PhotopeaContainer'; // Keep for reference
import MockupGallery from '@/components/ui/MockupGallery';
import ListingGenerator from '@/components/ui/ListingGenerator';
import { DesignImage, MockupPSD, MockupResult } from '@/types';

const DPI_OPTIONS = [
  { value: 72, label: '72 DPI (screen / web)' },
  { value: 150, label: '150 DPI (draft print)' },
  { value: 300, label: '300 DPI (print quality)' },
];

export default function Home() {
  const [designImage, setDesignImage] = useState<DesignImage | null>(null);
  const [mockupPSDs, setMockupPSDs] = useState<MockupPSD[]>([]);
  const [mockupResults, setMockupResults] = useState<MockupResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDpi, setExportDpi] = useState(72);
  const [customSmartObjectLayerName, setCustomSmartObjectLayerName] = useState('');

  const handleDesignUpload = (file: DesignImage | MockupPSD | (DesignImage | MockupPSD)[]) => {
    if (Array.isArray(file)) return;
    if (file.type !== 'design') return;
    setDesignImage(file);
  };

  const handleMockupUpload = (files: DesignImage | MockupPSD | (DesignImage | MockupPSD)[]) => {
    if (!Array.isArray(files)) return;
    setMockupPSDs(files.filter((f): f is MockupPSD => f.type === 'mockup'));
  };

  const handleMockupComplete = async (results: MockupResult[]) => {
    setMockupResults(results);
    setIsProcessing(false);
    
    // Clean up: Delete the design image after mockups are created to save space
    // PSD files are kept as they're reusable templates
    if (designImage && designImage.path) {
      try {
        const response = await fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: designImage.path }),
        });
        
        if (response.ok) {
          console.log('Design image cleaned up successfully');
        } else {
          const err = await response.json().catch(async () => ({ error: await response.text() }));
          console.warn('Failed to clean up design image:', err);
        }
      } catch (error) {
        console.error('Error cleaning up design image:', error);
        // Don't show error to user - cleanup failure is not critical
      }
    }
  };

  const handleStartProcessing = () => {
    if (!designImage || mockupPSDs.length === 0) {
      alert('Please upload a design image and at least one PSD mockup');
      return;
    }
    setIsProcessing(true);
  };

  return (
    <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
      <div className="max-w-1440 mx-auto px-2 sm:px-4">
        <h1 className="text-4xl font-bold mb-8 ">Esty Importer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold ">Upload Files</h2>
            
            <FileUpload
              label="Design Image"
              accept="image/*"
              onUpload={handleDesignUpload}
              uploadedFile={designImage}
            />

            <FileUpload
              label="PSD Mockup Files"
              accept=".psd,image/vnd.adobe.photoshop"
              multiple
              onUpload={handleMockupUpload}
              uploadedFiles={mockupPSDs}
            />

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Smart object layer name (optional)
              </label>
              <input
                type="text"
                value={customSmartObjectLayerName}
                onChange={(e) => setCustomSmartObjectLayerName(e.target.value)}
                placeholder="e.g. YOUR DESIGN HERE — leave blank for default"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use if your PSD layer has a different name. Default tries: YOUR DESIGN HERE, Design Here, Design.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Export DPI
              </label>
              <select
                value={exportDpi}
                onChange={(e) => setExportDpi(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none [&>option]:bg-white [&>option]:text-gray-900"
              >
                {DPI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Higher DPI = larger file, better for print. 72 is smaller and fine for web.
              </p>
            </div>

            {designImage && mockupPSDs.length > 0 && (
              <button
                onClick={handleStartProcessing}
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Generate Mockups'}
              </button>
            )}
          </div>

          {/* Custom Mockup Engine */}
          {isProcessing && designImage && mockupPSDs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Processing Mockups</h2>
              <CustomMockupEngine
                designImage={designImage}
                mockupPSDs={mockupPSDs}
                onComplete={handleMockupComplete}
                options={{
                  smartObjectLayerNames: customSmartObjectLayerName.trim()
                    ? [customSmartObjectLayerName.trim()]
                    : ['YOUR DESIGN HERE', 'Design Here', 'Design'],
                  exportFormat: 'jpg',
                  exportQuality: 90,
                  exportDpi,
                }}
              />
            </div>
          )}
        </div>

        {/* Results Section */}
        {mockupResults.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generated Mockups</h2>
            <MockupGallery mockups={mockupResults} />
          </div>
        )}

        {/* Listing Generator */}
        {mockupResults.length > 0 && (
          <div className="mt-8">
            <ListingGenerator mockups={mockupResults} />
          </div>
        )}
      </div>
    </main>
  );
}
