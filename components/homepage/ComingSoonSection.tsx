import type { ReactNode } from 'react';

function RoadmapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

const comingSoonItems: { icon: ReactNode; label: string }[] = [
  { icon: <RoadmapIcon className="w-5 h-5" />, label: 'Etsy auto publishing' },
  { icon: <RoadmapIcon className="w-5 h-5" />, label: 'Style detection' },
  { icon: <RoadmapIcon className="w-5 h-5" />, label: 'Bulk listing automation' },
  { icon: <RoadmapIcon className="w-5 h-5" />, label: 'Analytics' },
];

/**
 * Future features / roadmap — keeps product feeling evolving without overwhelming MVP.
 */
export default function ComingSoonSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          Coming Soon
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          We&apos;re building more ways to save you time. Here&apos;s what&apos;s on the roadmap.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {comingSoonItems.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              <span className="text-blue-500 dark:text-blue-400">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
