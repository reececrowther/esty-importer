'use client';

import { MockupResult } from '@/types';
import { useState } from 'react';

interface MockupGalleryProps {
  mockups: MockupResult[];
}

export default function MockupGallery({ mockups }: MockupGalleryProps) {
  const [selectedMockup, setSelectedMockup] = useState<MockupResult | null>(null);

  const handleDownload = async (mockup: MockupResult) => {
    try {
      const response = await fetch(mockup.exportedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mockup.mockupName.replace('.psd', '')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockups.map((mockup) => (
          <div
            key={mockup.mockupId}
            className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
            onClick={() => setSelectedMockup(mockup)}
          >
            <img
              src={mockup.exportedImageUrl}
              alt={mockup.mockupName}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-medium truncate text-gray-900 dark:text-gray-100">{mockup.mockupName}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(mockup);
                }}
                className="mt-2 w-full px-3 py-1 bg-green-200 dark:bg-green-700 hover:bg-green-300 dark:hover:bg-green-600 rounded text-sm text-gray-900 dark:text-white font-bold"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedMockup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedMockup(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedMockup.mockupName}</h2>
              <button
                onClick={() => setSelectedMockup(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedMockup.exportedImageUrl}
              alt={selectedMockup.mockupName}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDownload(selectedMockup)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
