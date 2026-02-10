import Link from 'next/link';
import { FEATURES } from '@/lib/features';

export default function FooterSection() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {FEATURES.MVP_MODE
            ? 'PrintPilot — Etsy Listing Automation for print & poster sellers'
            : 'PrintPilot — mockups & listings for sellers'}
        </span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Log in
          </Link>
          <Link href="/register" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
