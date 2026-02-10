'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MockupResult, ListingContent } from '@/types';
import { FEATURES } from '@/lib/features';

export interface ListingGeneratorRef {
  startNewListing: () => void;
}

interface ListingGeneratorProps {
  mockups: MockupResult[];
}

const ETSY_TITLE_MAX = 140;

const ListingGenerator = forwardRef<ListingGeneratorRef, ListingGeneratorProps>(function ListingGenerator({ mockups }, ref) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [listingContent, setListingContent] = useState<ListingContent | null>(null);
  const [designDescription, setDesignDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [etsyConnected, setEtsyConnected] = useState(false);
  const [isCheckingEtsy, setIsCheckingEtsy] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [publishNow, setPublishNow] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const checkEtsyConnection = () => {
    if (!FEATURES.ETSY_UPLOAD) return Promise.resolve({ connected: false }).finally(() => setIsCheckingEtsy(false));
    return fetch('/api/etsy/connect', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setEtsyConnected(Boolean(data.connected));
        return data;
      })
      .catch(() => {
        setEtsyConnected(false);
        return { connected: false };
      })
      .finally(() => setIsCheckingEtsy(false));
  };

  useEffect(() => {
    if (FEATURES.ETSY_UPLOAD) {
      checkEtsyConnection();
    } else {
      setIsCheckingEtsy(false);
    }
  }, []);

  // After OAuth redirect (?etsy=connected or ?etsy=error), refetch and clean URL. TODO: Re-enable when ETSY_UPLOAD feature is on.
  useEffect(() => {
    if (typeof window === 'undefined' || !FEATURES.ETSY_UPLOAD) return;
    const params = new URLSearchParams(window.location.search);
    const etsy = params.get('etsy');
    if (etsy === 'connected' || etsy === 'error') {
      params.delete('etsy');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      if (etsy === 'connected') {
        checkEtsyConnection().then((data) => {
          if (data.connected) setUploadMessage({ type: 'success', text: 'Etsy store connected. You can now upload listings.' });
        });
      } else {
        setUploadMessage({ type: 'error', text: 'Etsy connection failed. Please try again.' });
      }
    }
  }, []);

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
          imageUrls: mockups.length > 0 ? mockups.slice(0, 5).map((m) => m.exportedImageUrl) : undefined,
        }),
      });

      const content = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = content.message || content.error || 'Failed to generate listing';
        if (response.status === 403 && content.error === 'limit_exceeded') {
          setUploadMessage({ type: 'error', text: msg + ' Upgrade to Plus in Settings for unlimited generations.' });
        } else {
          throw new Error(msg);
        }
        return;
      }

      setListingContent(content);
    } catch (error) {
      console.error('Generation error:', error);
      setUploadMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate listing content' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleUploadToEtsy = async () => {
    if (!listingContent) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const response = await fetch('/api/etsy/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing: {
            ...listingContent,
            images: mockups.map((m) => m.exportedImageUrl),
            price: price !== '' ? parseFloat(price) : undefined,
            quantity: quantity !== '' ? parseInt(quantity, 10) : undefined,
          },
          publish: publishNow,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.message || data.error || 'Failed to upload to Etsy';
        if (response.status === 403 && data.error === 'limit_exceeded') {
          setUploadMessage({ type: 'error', text: msg + ' Upgrade to Plus in Settings for unlimited uploads.' });
        } else {
          throw new Error(msg);
        }
        return;
      }

      setUploadMessage({
        type: 'success',
        text: etsyConnected
          ? `Listing ${publishNow ? 'published' : 'saved as draft'}! View: ${data.url}`
          : `Listing created (stub). ID: ${data.listingId}`,
      });
    } catch (error) {
      console.error('Etsy upload error:', error);
      setUploadMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload to Etsy.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDisconnectEtsy = async () => {
    try {
      await fetch('/api/etsy/disconnect', { method: 'POST', credentials: 'include' });
      setEtsyConnected(false);
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const handleNewListing = () => {
    setListingContent(null);
    setDesignDescription('');
    setProductType('');
    setKeywords('');
    setPrice('');
    setQuantity('1');
    setPublishNow(false);
    setUploadMessage(null);
    setCopyFeedback(null);
  };

  useImperativeHandle(ref, () => ({
    startNewListing: handleNewListing,
  }), []);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generate Etsy Listing</h2>
        <div className="flex items-center gap-2">
          {FEATURES.ETSY_UPLOAD && !isCheckingEtsy && (
          <div className="flex items-center gap-2">
            {etsyConnected ? (
              <>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Etsy connected</span>
                <button
                  type="button"
                  onClick={handleDisconnectEtsy}
                  className="text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/etsy/auth"
                className="text-sm px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Connect Etsy Store
              </a>
            )}
          </div>
          )}
        </div>
      </div>

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
          {copyFeedback && (
            <div className="text-sm text-green-600 dark:text-green-400 font-medium animate-pulse">
              {copyFeedback}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Title <span className={`font-normal ${listingContent.title.length > ETSY_TITLE_MAX ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>({listingContent.title.length}/{ETSY_TITLE_MAX})</span>
              </label>
              <button
                onClick={() => handleCopyToClipboard(listingContent.title)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <input
              type="text"
              value={listingContent.title}
              onChange={(e) => setListingContent({ ...listingContent, title: e.target.value.slice(0, ETSY_TITLE_MAX) })}
              maxLength={ETSY_TITLE_MAX}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Listing title"
            />
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
            <textarea
              value={listingContent.description}
              onChange={(e) => setListingContent({ ...listingContent, description: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 whitespace-pre-wrap resize-y"
              placeholder="Listing description"
            />
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

          {/* TODO: Re-enable when FEATURES.ETSY_UPLOAD is true. Etsy publishing remains in code for future SaaS. */}
          {FEATURES.ETSY_UPLOAD && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 9.99"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Required for Etsy. Defaults to 1.00 if empty.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Publish immediately (otherwise save as draft)</span>
                </label>
              </div>

              {uploadMessage && (
                <div
                  className={`text-sm font-medium p-3 rounded ${
                    uploadMessage.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  }`}
                >
                  {uploadMessage.text}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleUploadToEtsy}
                  disabled={isUploading}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : etsyConnected ? (publishNow ? 'Publish to Etsy' : 'Save as draft on Etsy') : 'Upload to Etsy (stub)'}
                </button>
                {!etsyConnected && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                    Connect your Etsy store to publish real listings.
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default ListingGenerator;
