import type { ReactNode } from 'react';

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  );
}

const steps: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <UploadIcon className="w-8 h-8" />,
    title: 'Upload artwork',
    description: 'Drop your design file. We support images for print and poster mockups.',
  },
  {
    icon: <SparklesIcon className="w-8 h-8" />,
    title: 'Generate Listing Pack',
    description: 'Get mockup images plus AI-written title, description, and SEO tags.',
  },
  {
    icon: <ExportIcon className="w-8 h-8" />,
    title: 'Publish or Export',
    description: 'Preview, download, and paste into Etsy — or connect your shop when ready.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          How It Works
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Three steps from artwork to Etsy-ready listing.
        </p>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {step.icon}
              </div>
              <span className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                Step {i + 1}
              </span>
              <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                {step.description}
              </p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+3rem)] lg:left-[calc(50%+4rem)] w-full max-w-[calc(100%-4rem)] border-t border-dashed border-gray-300 dark:border-gray-600" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
