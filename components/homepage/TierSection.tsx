import Link from 'next/link';
import { TIER_LIMITS } from '@/lib/tierConstants';
import { FEATURES } from '@/lib/features';

const TOOL_LABELS: Record<string, string> = {
  'etsy-importer': 'PrintPilot',
  'bulk-edit': 'Bulk Edit',
  'listing-templates': 'Listing Templates',
  inventory: 'Inventory',
};

/**
 * Tier comparison — existing feature, unchanged logic.
 * MVP: focus on mockups + listing gens; Etsy upload optional via feature flag.
 */
export default function TierSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-gray-200 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-900/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white">
          {FEATURES.MVP_MODE ? 'Simple limits' : 'Compare plans'}
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {FEATURES.MVP_MODE
            ? 'Start free with monthly mockup and listing limits. Upgrade for unlimited use.'
            : 'Start free and upgrade when you need unlimited mockups, uploads, and extra tools.'}
        </p>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Free</h3>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium px-3 py-1">Starter</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              £0<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
              {FEATURES.MVP_MODE ? 'Create mockups and listings with monthly limits.' : 'Try mockups and listings with monthly limits.'}
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                <span className="text-gray-700 dark:text-gray-300"><strong>{TIER_LIMITS.FREE.mockupsPerMonth}</strong> mockups per month</span>
              </li>
              {FEATURES.ETSY_UPLOAD && (
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                  <span className="text-gray-700 dark:text-gray-300"><strong>{TIER_LIMITS.FREE.etsyUploadsPerMonth}</strong> Etsy uploads per month</span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                <span className="text-gray-700 dark:text-gray-300"><strong>{TIER_LIMITS.FREE.listingGensPerMonth}</strong> listing generations per month</span>
              </li>
              {!FEATURES.MVP_MODE && (
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Tools: {TIER_LIMITS.FREE.tools.map((t) => TOOL_LABELS[t] ?? t).join(', ')}</span>
                </li>
              )}
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full text-center rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Get started free
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-lg ring-2 ring-blue-500/20 dark:ring-blue-400/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold px-3 py-1">
              Best value
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Plus</h3>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1">Unlimited</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              £14.99<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
              {FEATURES.MVP_MODE ? 'Unlimited mockups and listing generations.' : 'Unlimited usage and every tool included.'}
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                <span className="text-gray-700 dark:text-gray-300"><strong>Unlimited</strong> mockups per month</span>
              </li>
              {FEATURES.ETSY_UPLOAD && (
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                  <span className="text-gray-700 dark:text-gray-300"><strong>Unlimited</strong> Etsy uploads per month</span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                <span className="text-gray-700 dark:text-gray-300"><strong>Unlimited</strong> listing generations per month</span>
              </li>
              {!FEATURES.MVP_MODE && (
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-0.5" aria-hidden>✓</span>
                  <span className="text-gray-700 dark:text-gray-300">All tools: {TIER_LIMITS.PLUS.tools.map((t) => TOOL_LABELS[t] ?? t).join(', ')}</span>
                </li>
              )}
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full text-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Upgrade to Plus
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
