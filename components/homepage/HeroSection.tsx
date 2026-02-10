import Link from 'next/link';
import Image from 'next/image';

/**
 * Hero media: use 'image' or 'video' and add the file to public/ for a real product preview.
 * Leave as 'placeholder' to show the animated workflow graphic.
 */
const HERO_MEDIA: { type: 'placeholder' } | { type: 'image'; src: string; alt?: string } | { type: 'video'; src: string } = {
  type: 'image', src: '/hero-preview.png', alt: 'PrintPilot dashboard',
  // To use a screenshot: type: 'image', src: '/hero-preview.png', alt: 'PrintPilot dashboard'
  // To use a demo video: type: 'video', src: '/hero-demo.mp4'
};

function HeroMedia() {
  if (HERO_MEDIA.type === 'video') {
    return (
      <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/20 shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
        <video
          className="w-full aspect-video object-cover"
          src={HERO_MEDIA.src}
          autoPlay
          muted
          loop
          playsInline
          aria-label="Product demo"
        />
      </div>
    );
  }

  if (HERO_MEDIA.type === 'image') {
    return (
      <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
        <div className="relative aspect-video w-full">
          <Image
            src={HERO_MEDIA.src}
            alt={HERO_MEDIA.alt ?? 'How PrintPilot works'}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        </div>
      </div>
    );
  }

  /* Default: placeholder workflow graphic */
  return (
    <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow-xl overflow-hidden">
      <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Artwork</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">→</span>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <div className="grid grid-cols-2 gap-0.5 p-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-800" />
                ))}
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Mockups</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">→</span>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Listing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-medium px-4 py-1.5 mb-6">
          Etsy Listing Automation for Print & Poster Sellers
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
          Turn Your Artwork Into{' '}
          <span className="text-blue-600 dark:text-blue-400">Ready-to-Sell Etsy Listings</span>{' '}
          in Seconds
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-balance">
          Automatically generate mockups, SEO titles, descriptions, and tags — built for print and poster sellers.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login?callbackUrl=/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            Create Your First Listing Pack
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            See How It Works
          </a>
        </div>
        <HeroMedia />
      </div>
    </section>
  );
}
