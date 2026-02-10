import Link from 'next/link';
import { FEATURES } from '@/lib/features';

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {FEATURES.MVP_MODE ? 'Ready to create your first listing?' : 'Ready to save time?'}
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {FEATURES.MVP_MODE
            ? 'Sign in or create an account, then go to Create Etsy Listing to upload your art and get mockups + AI copy.'
            : 'Create an account and start generating mockups and listings today.'}
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold px-6 py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </section>
  );
}
