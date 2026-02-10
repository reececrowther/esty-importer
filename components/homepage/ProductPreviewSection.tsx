'use client';

/**
 * Visual demo area: artwork input → mockup outputs → generated listing text.
 * Workflow animation shows the flow in a 6s loop.
 */
export default function ProductPreviewSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          See the automation in action
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          One artwork in, listing pack out — no manual copy-pasting.
        </p>

        {/* Workflow step labels + moving indicator */}
        <div className="mt-12 relative mx-auto max-w-2xl">
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            <span>1. Upload</span>
            <span>2. Generate</span>
            <span>3. Export</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-visible relative">
            <div
              className="absolute top-1/2 w-3 h-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-md"
              style={{
                animation: 'workflow-indicator 6s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden shadow-lg">
          {/* Arrows on top — flow: Input → Generate → Export */}
          <div className="hidden lg:flex items-center justify-center gap-2 sm:gap-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-800/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Input</span>
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" style={{ animation: 'workflow-arrow-pulse 6s ease-in-out infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Generate</span>
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" style={{ animation: 'workflow-arrow-pulse-2 6s ease-in-out infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Export</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Artwork input */}
            <div
              className="relative p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-t-2xl lg:rounded-tr-none lg:rounded-l-2xl transition-shadow duration-300"
              style={{ animation: 'workflow-highlight-1 6s ease-in-out infinite' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                Input
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Your artwork</p>
              <div
                className="aspect-square max-w-[200px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                style={{ animation: 'workflow-artwork-fade-up 6s ease-out infinite' }}
              >
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
              </div>
            </div>

            {/* Mockup outputs */}
            <div
              className="relative p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
              style={{ animation: 'workflow-highlight-2 6s ease-in-out infinite' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                Mockups
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Generated frames</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 1, anim: 'workflow-mockup-1' },
                  { key: 2, anim: 'workflow-mockup-2' },
                  { key: 3, anim: 'workflow-mockup-3' },
                ].map(({ key, anim }) => (
                  <div
                    key={key}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center"
                    style={{ animation: `${anim} 6s ease-in-out infinite` }}
                  >
                    <div className="w-3/4 h-3/4 rounded bg-blue-100 dark:bg-blue-900/50" />
                  </div>
                ))}
              </div>
            </div>

            {/* Generated listing text */}
            <div
              className="relative p-6 sm:p-8 bg-white dark:bg-gray-950 rounded-b-2xl lg:rounded-bl-none lg:rounded-r-2xl transition-shadow duration-300"
              style={{ animation: 'workflow-highlight-3 6s ease-in-out infinite' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                Listing copy
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Title, description & tags</p>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="truncate" title="Minimalist Abstract Art Print..." style={{ animation: 'workflow-line-1 6s ease-in-out infinite' }}>
                  Minimalist Abstract Art Print...
                </p>
                <p className="line-clamp-2" style={{ animation: 'workflow-line-2 6s ease-in-out infinite' }}>
                  Etsy-ready description with keywords...
                </p>
                <p className="text-gray-500 dark:text-gray-500" style={{ animation: 'workflow-line-3 6s ease-in-out infinite' }}>
                  #wallart #poster #print
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
