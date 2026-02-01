'use client';

import { useState } from 'react';
import { MockupResult, ListingContent } from '@/types';

interface ListingGeneratorProps {
  mockups: MockupResult[];
}

export default function ListingGenerator({ mockups }: ListingGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [listingContent, setListingContent] = useState<ListingContent | null>(null);
  const [designDescription, setDesignDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [keywords, setKeywords] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designDescription,
          productType,
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          mockupCount: mockups.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate listing');
      }

      const content = await response.json();
      setListingContent(content);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate listing content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleUploadToEtsy = async () => {
    if (!listingContent) return;

    try {
      const response = await fetch('/api/etsy/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing: {
            ...listingContent,
            images: mockups.map((m) => m.exportedImageUrl),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Etsy');
      }

      const result = await response.json();
      alert(`Listing uploaded! ID: ${result.listingId}`);
    } catch (error) {
      console.error('Etsy upload error:', error);
      alert('Failed to upload to Etsy. Make sure Etsy API is configured.');
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generate Etsy Listing</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
            Design Description (optional)
          </label>
          <textarea
            value={designDescription}
            onChange={(e) => setDesignDescription(e.target.value)}
            placeholder="Describe your design..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
            Product Type (optional)
          </label>
          <input
            type="text"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder="e.g., Digital Print, T-Shirt Design, Wall Art"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
            Keywords (comma-separated, optional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., modern, minimalist, abstract"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Listing Content'}
        </button>
      </div>

      {listingContent && (
        <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Title</label>
              <button
                onClick={() => handleCopyToClipboard(listingContent.title)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              {listingContent.title}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Description</label>
              <button
                onClick={() => handleCopyToClipboard(listingContent.description)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {listingContent.description}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Tags ({listingContent.tags.length}/13)</label>
              <button
                onClick={() => handleCopyToClipboard(listingContent.tags.join(', '))}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Copy All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {listingContent.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleUploadToEtsy}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Upload to Etsy (Stub)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
