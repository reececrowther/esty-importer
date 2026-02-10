'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/ui/FileUpload';
import CustomMockupEngine from '@/components/mockupEngine/CustomMockupEngine';
import PhotopeaContainer from '@/components/photopea/PhotopeaContainer';
import MockupGallery from '@/components/ui/MockupGallery';
import ListingGenerator, { type ListingGeneratorRef } from '@/components/ui/ListingGenerator';
import { DesignImage, MockupPSD, MockupResult } from '@/types';
import { FEATURES } from '@/lib/features';
import { MOCKUP_PACKS, getPackEntries } from '@/lib/mockupPacks';

interface UsageData {
  tier: 'FREE' | 'PLUS';
  usage: { mockupsUsedInPeriod: number; etsyUploadsUsedInPeriod: number; listingGensUsedInPeriod: number };
  limits: { mockupsPerMonth: number | null; etsyUploadsPerMonth: number | null; listingGensPerMonth: number | null };
  periodKey: string | null;
}

const DPI_OPTIONS = [
  { value: 72, label: '72 DPI (screen / web)' },
  { value: 150, label: '150 DPI (draft print)' },
  { value: 300, label: '300 DPI (print quality)' },
];

const IMAGE_FIT_OPTIONS = [
  { value: 'cover', label: 'Fill frame (may crop design)' },
  { value: 'contain', label: 'Fit inside frame (no overflow)' },
];

// Use Photopea (in-browser) when server-side canvas is unavailable (e.g. Vercel). Set in Vercel: NEXT_PUBLIC_MOCKUP_ENGINE=photopea
const USE_PHOTOPEA_MOCKUPS = process.env.NEXT_PUBLIC_MOCKUP_ENGINE === 'photopea';

/** MVP: 5-step linear flow. Step indices 1–5. */
const WIZARD_STEPS = [
  '1. Upload artwork',
  '2. Select mockup pack',
  '3. Generate mockups',
  '4. Generate listing',
  '5. Preview & Download',
] as const;

export default function EtsyImporterPage() {
  const [designImage, setDesignImage] = useState<DesignImage | null>(null);
  const [mockupPSDs, setMockupPSDs] = useState<MockupPSD[]>([]);
  const [mockupResults, setMockupResults] = useState<MockupResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDpi, setExportDpi] = useState(72);
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('cover');
  const [customSmartObjectLayerName, setCustomSmartObjectLayerName] = useState('');
  const [mockupSource, setMockupSource] = useState<'custom' | 'pack'>('custom');
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const generatedMockupsRef = useRef<HTMLDivElement>(null);
  const listingSectionRef = useRef<HTMLDivElement>(null);
  const listingGeneratorRef = useRef<ListingGeneratorRef>(null);

  /** Effective list: custom uploads or selected pack entries (for generate button and engine). */
  const effectiveMockupPSDs: MockupPSD[] =
    mockupSource === 'pack' && selectedPackId
      ? getPackEntries(selectedPackId).map((e, i) => ({
          id: `pack-${selectedPackId}-${i}`,
          filename: e.originalName,
          originalName: e.originalName,
          path: e.path,
          size: 0,
          mimeType: 'image/vnd.adobe.photoshop',
          uploadedAt: new Date(),
          type: 'mockup' as const,
        }))
      : mockupPSDs;

  const handleDesignUpload = (file: DesignImage | MockupPSD | (DesignImage | MockupPSD)[]) => {
    if (Array.isArray(file)) return;
    if (file.type !== 'design') return;
    setDesignImage(file);
  };

  const handleMockupUpload = (files: DesignImage | MockupPSD | (DesignImage | MockupPSD)[]) => {
    if (!Array.isArray(files)) return;
    setMockupPSDs(files.filter((f): f is MockupPSD => f.type === 'mockup'));
  };

  const handleMockupSourceChange = (source: 'custom' | 'pack') => {
    setMockupSource(source);
    if (source === 'pack') setMockupPSDs([]);
    else setSelectedPackId('');
  };

  const handleMockupComplete = async (results: MockupResult[]) => {
    setMockupResults(results);
    setIsProcessing(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        generatedMockupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });

    if (designImage && designImage.path) {
      try {
        const response = await fetch('/api/files/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: designImage.path }),
        });
        if (!response.ok) {
          const err = await response.json().catch(async () => ({ error: await response.text() }));
          console.warn('Failed to clean up design image:', err);
        }
      } catch (error) {
        console.error('Error cleaning up design image:', error);
      }
    }
  };

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch('/api/user/usage', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => setUsage(null));
  }, [mockupResults.length]);

  const handleStartProcessing = () => {
    setUploadError(null);
    if (!designImage || effectiveMockupPSDs.length === 0) {
      setUploadError(
        mockupSource === 'pack'
          ? 'Please select a mockup pack.'
          : 'Please upload a design image and at least one PSD mockup.'
      );
      return;
    }
    setIsProcessing(true);
  };

  // MVP: 5-step progress. Step 5 = has mockup results (Preview & Download).
  const currentStep = !designImage
    ? 1
    : effectiveMockupPSDs.length === 0
      ? 2
      : mockupResults.length === 0
        ? 3
        : 4; // 4 = Generate listing, 5 = Preview & Download (same block; we show 5 as "current" when results exist for nav)
  const stepLabelsLegacy = ['1. Upload files', '2. Generate mockups', '3. Listing & upload'];
  const stepLabels = FEATURES.MVP_MODE ? [...WIZARD_STEPS] : stepLabelsLegacy;
  const step = FEATURES.MVP_MODE
    ? currentStep
    : !designImage && mockupPSDs.length === 0
      ? 1
      : mockupResults.length === 0
        ? isProcessing
          ? 2
          : 1
        : 3;
  const maxStep = FEATURES.MVP_MODE ? 5 : 3;

  return (
    <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
      <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
        <h1 className="text-4xl font-bold mb-2">{FEATURES.MVP_MODE ? 'Create Etsy Listing' : 'PrintPilot'}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {FEATURES.MVP_MODE
            ? 'Upload your artwork, choose mockup templates, generate mockups, then get AI-generated listing copy. Preview and download.'
            : 'Upload a design and PSD mockups, then generate listing content and publish to Etsy.'}
        </p>

        {usage && usage.tier === 'FREE' && (
          <div className="mb-6 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Free tier: {usage.usage.mockupsUsedInPeriod} / {usage.limits.mockupsPerMonth ?? '∞'} mockups, {usage.usage.etsyUploadsUsedInPeriod} / {usage.limits.etsyUploadsPerMonth ?? '∞'} Etsy uploads, {usage.usage.listingGensUsedInPeriod} / {usage.limits.listingGensPerMonth ?? '∞'} listing generations this month.
            </p>
            <Link
              href="/dashboard/settings?upgrade=1"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Upgrade to Plus →
            </Link>
          </div>
        )}

        <nav className="flex flex-wrap gap-3 sm:gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4" aria-label="Progress">
          {stepLabels.slice(0, maxStep).map((label, i) => {
            const stepNum = i + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <span
                key={label}
                className={`text-sm font-medium ${active ? 'text-blue-600 dark:text-blue-400' : done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {done && '✓ '}
                {label}
              </span>
            );
          })}
        </nav>

        {uploadError && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
            {uploadError}
          </div>
        )}

        {FEATURES.MVP_MODE ? (
          <>
            {/* MVP: Step 1 – Upload artwork */}
            <section className="mb-8 space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step 1: Upload artwork</h2>
              <FileUpload
                label="Design / Artwork Image"
                accept="image/*"
                onUpload={handleDesignUpload}
                uploadedFile={designImage}
              />
            </section>

            {/* MVP: Step 2 – Select mockup pack (custom upload or built-in pack) */}
            <section className="mb-8 space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step 2: Select mockup pack</h2>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose mockup source</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mockupSource"
                      checked={mockupSource === 'custom'}
                      onChange={() => handleMockupSourceChange('custom')}
                      className="rounded-full border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Upload custom mockups (PSD files)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mockupSource"
                      checked={mockupSource === 'pack'}
                      onChange={() => handleMockupSourceChange('pack')}
                      className="rounded-full border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Use a mockup pack</span>
                  </label>
                </div>
              </div>

              {mockupSource === 'custom' && (
                <FileUpload
                  label="PSD Mockup Files"
                  accept=".psd,image/vnd.adobe.photoshop"
                  multiple
                  onUpload={handleMockupUpload}
                  uploadedFiles={mockupPSDs}
                />
              )}

              {mockupSource === 'pack' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Mockup pack</label>
                  <select
                    value={selectedPackId}
                    onChange={(e) => setSelectedPackId(e.target.value)}
                    className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a pack…</option>
                    {MOCKUP_PACKS.map((pack) => {
                      const total = pack.vertical.length + pack.horizontal.length;
                      const label =
                        pack.vertical.length && pack.horizontal.length
                          ? `${pack.name} — ${pack.vertical.length} vertical, ${pack.horizontal.length} horizontal`
                          : `${pack.name} — ${total} mockups`;
                      return (
                        <option key={pack.id} value={pack.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {selectedPackId && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getPackEntries(selectedPackId).length} mockups total (vertical then horizontal). Packs will be grouped and expanded in future updates.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Smart object layer (optional)</label>
                  <input
                    type="text"
                    value={customSmartObjectLayerName}
                    onChange={(e) => setCustomSmartObjectLayerName(e.target.value)}
                    placeholder="e.g. YOUR DESIGN HERE"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Image fit</label>
                  <select
                    value={imageFit}
                    onChange={(e) => setImageFit(e.target.value as 'contain' | 'cover')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {IMAGE_FIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fill frame fills the area; fit inside shows the whole design (no crop).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Export DPI</label>
                  <select
                    value={exportDpi}
                    onChange={(e) => setExportDpi(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {DPI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {designImage && effectiveMockupPSDs.length > 0 && (
                <button
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                  className="mt-2 w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Step 3: Generate mockups'}
                </button>
              )}
            </section>

            {/* MVP: Step 3 – Processing + Generated mockups */}
            {isProcessing && designImage && effectiveMockupPSDs.length > 0 && (
              <section className="mb-8 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generating mockups</h2>
                {USE_PHOTOPEA_MOCKUPS ? (
                  <PhotopeaContainer
                    designImage={designImage}
                    mockupPSDs={effectiveMockupPSDs}
                    onComplete={handleMockupComplete}
                  />
                ) : (
                  <CustomMockupEngine
                    designImage={designImage}
                    mockupPSDs={effectiveMockupPSDs}
                    onComplete={handleMockupComplete}
                    options={{
                      smartObjectLayerNames: customSmartObjectLayerName.trim()
                        ? [customSmartObjectLayerName.trim()]
                        : ['YOUR DESIGN HERE', 'Design Here', 'Design'],
                      exportFormat: 'jpg',
                      exportQuality: 90,
                      exportDpi,
                      imageFit,
                    }}
                  />
                )}
              </section>
            )}

            {mockupResults.length > 0 && (
              <section ref={generatedMockupsRef} className="mb-8 space-y-4 scroll-mt-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generated mockups</h2>
                <MockupGallery mockups={mockupResults} onReorder={setMockupResults} />
              </section>
            )}

            {/* MVP: Step 4 & 5 – Generate listing + Preview & Download */}
            {mockupResults.length > 0 && (
              <section ref={listingSectionRef} className="mt-8 space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step 4: Generate listing</h2>
                <ListingGenerator ref={listingGeneratorRef} mockups={mockupResults} />
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Step 5: Preview &amp; Download</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Use &quot;Download all (ZIP)&quot; above for mockup images. Copy title, description, and tags from the listing section to use in Etsy.
                  </p>
                  <button
                    type="button"
                    onClick={() => listingGeneratorRef.current?.startNewListing()}
                    className="text-sm px-3 py-1.5 border border-gray-400 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                  >
                    New listing
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Upload Files</h2>
                <FileUpload label="Design Image" accept="image/*" onUpload={handleDesignUpload} uploadedFile={designImage} />
                <FileUpload label="PSD Mockup Files" accept=".psd,image/vnd.adobe.photoshop" multiple onUpload={handleMockupUpload} uploadedFiles={mockupPSDs} />
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Smart object layer name (optional)</label>
                  <input type="text" value={customSmartObjectLayerName} onChange={(e) => setCustomSmartObjectLayerName(e.target.value)} placeholder="e.g. YOUR DESIGN HERE — leave blank for default" className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use if your PSD layer has a different name. Default tries: YOUR DESIGN HERE, Design Here, Design.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Image fit in frame</label>
                  <select value={imageFit} onChange={(e) => setImageFit(e.target.value as 'contain' | 'cover')} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none [&>option]:bg-white [&>option]:text-gray-900">
                    {IMAGE_FIT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">&quot;Fit inside frame&quot; keeps the whole design visible (no overflow). &quot;Fill frame&quot; fills the frame and may crop.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Export DPI</label>
                  <select value={exportDpi} onChange={(e) => setExportDpi(Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none [&>option]:bg-white [&>option]:text-gray-900">
                    {DPI_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Higher DPI = larger file, better for print. 72 is smaller and fine for web.</p>
                </div>
                {designImage && mockupPSDs.length > 0 && (
                  <button onClick={handleStartProcessing} disabled={isProcessing} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessing ? 'Processing...' : 'Generate Mockups'}
                  </button>
                )}
              </div>
              {isProcessing && designImage && mockupPSDs.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Processing Mockups</h2>
                  {USE_PHOTOPEA_MOCKUPS ? (
                    <PhotopeaContainer designImage={designImage} mockupPSDs={mockupPSDs} onComplete={handleMockupComplete} />
                  ) : (
                    <CustomMockupEngine designImage={designImage} mockupPSDs={mockupPSDs} onComplete={handleMockupComplete} options={{ smartObjectLayerNames: customSmartObjectLayerName.trim() ? [customSmartObjectLayerName.trim()] : ['YOUR DESIGN HERE', 'Design Here', 'Design'], exportFormat: 'jpg', exportQuality: 90, exportDpi, imageFit }} />
                  )}
                </div>
              )}
            </div>
            {mockupResults.length > 0 && (
              <div ref={generatedMockupsRef} className="mt-8 space-y-4 scroll-mt-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Generated Mockups</h2>
                <MockupGallery mockups={mockupResults} onReorder={setMockupResults} />
              </div>
            )}
            {mockupResults.length > 0 && (
              <div className="mt-8">
                <ListingGenerator mockups={mockupResults} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
