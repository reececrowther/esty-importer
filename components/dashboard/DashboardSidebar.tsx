'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Tier } from '@prisma/client';
import { canUseTool } from '@/lib/tierConstants';
import { FEATURES } from '@/lib/features';

/** All tools. MVP_MODE shows only etsy-importer as "Create Etsy Listing". TODO: Re-enable others via ADVANCED_AI_TOOLS. */
const ALL_TOOLS: { href: string; label: string; icon: string; slug: string }[] = [
  { href: '/dashboard/etsy-importer', label: FEATURES.MVP_MODE ? 'Create Etsy Listing' : 'PrintPilot', icon: 'Shop', slug: 'etsy-importer' },
  { href: '/dashboard/bulk-edit', label: 'Bulk Edit', icon: 'Edit', slug: 'bulk-edit' },
  { href: '/dashboard/listing-templates', label: 'Listing Templates', icon: 'FileText', slug: 'listing-templates' },
  { href: '/dashboard/inventory', label: 'Inventory', icon: 'Package', slug: 'inventory' },
];

const TOOLS = FEATURES.MVP_MODE
  ? ALL_TOOLS.filter((t) => t.slug === 'etsy-importer')
  : FEATURES.ADVANCED_AI_TOOLS
    ? ALL_TOOLS
    : ALL_TOOLS.filter((t) => t.slug === 'etsy-importer');

const SETTINGS = [
  { href: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
  { href: '/dashboard/settings/etsy', label: 'Etsy store', icon: 'Store' },
] as const;

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function NavIcon({ name }: { name: string }) {
  const iconClass = 'w-5 h-5 shrink-0';
  switch (name) {
    case 'Shop':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'Edit':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'FileText':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'Package':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M16.5 9.4 7.55 4.24" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'Settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'Store':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function DashboardSidebar({ tier = 'FREE' }: { tier?: Tier }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 min-h-[calc(100vh-3.5rem)]">
      {/* Tools – top */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Tools
        </p>
        {TOOLS.map(({ href, label, icon, slug }) => {
          const isActive = pathname === href;
          const allowed = canUseTool(tier, slug);
          const content = (
            <>
              <NavIcon name={icon} />
              <span className="flex-1">{label}</span>
              {!allowed && (
                <span className="text-amber-600 dark:text-amber-400" title="Plus only">
                  <LockIcon />
                </span>
              )}
            </>
          );
          if (allowed) {
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {content}
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href="/dashboard/settings?upgrade=1"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Settings – bottom */}
      <nav className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Settings
        </p>
        {(FEATURES.ETSY_UPLOAD ? SETTINGS : SETTINGS.filter((s) => !s.href.includes('etsy'))).map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <NavIcon name={icon} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
