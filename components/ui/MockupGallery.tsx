'use client';

import { MockupResult } from '@/types';
import { useState } from 'react';
import JSZip from 'jszip';

interface MockupGalleryProps {
  mockups: MockupResult[];
  /** When provided, enables drag-and-drop reorder. First image = main Etsy listing image. */
  onReorder?: (ordered: MockupResult[]) => void;
}

function safeFileName(name: string): string {
  return name.replace(/\.psd$/i, '').replace(/[^\w.-]/g, '_') || 'mockup';
}

export default function MockupGallery({ mockups, onReorder }: MockupGalleryProps) {
  const [selectedMockup, setSelectedMockup] = useState<MockupResult | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggedIndex(null);
    if (onReorder == null || draggedIndex === null || draggedIndex === dropIndex) return;
    const newOrder = [...mockups];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    onReorder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDownload = async (mockup: MockupResult) => {
    try {
      const response = await fetch(mockup.exportedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName(mockup.mockupName)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download image');
    }
  };

  const handleDownloadAllZip = async () => {
    if (mockups.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();
      for (let i = 0; i < mockups.length; i++) {
        const mockup = mockups[i];
        const base = safeFileName(mockup.mockupName);
        let name = `${base}.jpg`;
        let n = 0;
        while (usedNames.has(name)) {
          n += 1;
          name = `${base}_${n}.jpg`;
        }
        usedNames.add(name);
        const response = await fetch(mockup.exportedImageUrl);
        const blob = await response.blob();
        zip.file(name, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mockups-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Zip download error:', error);
      alert('Failed to create zip download');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onReorder != null && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag to reorder. The first image will be the main listing photo on Etsy.
          </p>
        )}
        <button
          type="button"
          onClick={handleDownloadAllZip}
          disabled={isDownloadingZip || mockups.length === 0}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shrink-0"
        >
          {isDownloadingZip ? 'Creating zip...' : 'Download all (ZIP)'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockups.map((mockup, index) => (
          <div
            key={mockup.mockupId}
            draggable={onReorder != null}
            onDragStart={(e) => onReorder && handleDragStart(e, index)}
            onDragOver={onReorder ? handleDragOver : undefined}
            onDrop={onReorder ? (e) => handleDrop(e, index) : undefined}
            onDragEnd={onReorder ? handleDragEnd : undefined}
            className={`border rounded-lg overflow-hidden transition-shadow bg-white dark:bg-gray-800 cursor-pointer ${
              onReorder ? 'border-gray-300 dark:border-gray-600 hover:shadow-lg' : ''
            } ${draggedIndex === index ? 'opacity-60 ring-2 ring-blue-500' : ''} ${onReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onClick={() => setSelectedMockup(mockup)}
          >
            {onReorder != null && (
              <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-4 h-4 text-center font-medium text-gray-600 dark:text-gray-300">{index + 1}</span>
                <span>Drag to reorder</span>
              </div>
            )}
            <img
              src={mockup.exportedImageUrl}
              alt={mockup.mockupName}
              className="w-full h-48 object-cover pointer-events-none"
              draggable={false}
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
