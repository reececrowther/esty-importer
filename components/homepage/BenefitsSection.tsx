import type { ReactNode } from 'react';

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

const benefits: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <ClockIcon className="w-6 h-6" />,
    title: 'Save hours per listing',
    description: 'Stop writing titles and descriptions by hand. Get Etsy-ready copy in seconds.',
  },
  {
    icon: <GridIcon className="w-6 h-6" />,
    title: 'Batch create mockups instantly',
    description: 'One artwork, multiple frames. Generate a full set of listing images at once.',
  },
  {
    icon: <TagIcon className="w-6 h-6" />,
    title: 'SEO titles written for you',
    description: 'AI-generated titles and tags tuned for Etsy search — so buyers can find you.',
  },
  {
    icon: <StoreIcon className="w-6 h-6" />,
    title: 'Built for Etsy poster sellers',
    description: 'Designed around print and poster workflows, not generic mockup tools.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          Why creators choose PrintPilot
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Outcomes that matter — less busywork, more selling.
        </p>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-6 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                {b.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {b.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
