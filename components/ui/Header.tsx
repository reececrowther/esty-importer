'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FEATURES } from '@/lib/features';

const THEME_KEY = 'esty-importer-theme';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function LogoIcon({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <rect width="40" height="40" rx="8" fill={`url(#${id}-bg)`}/>
      <g className="logo-plane-woosh" style={{ transformOrigin: '20px 20px' }}>
        <path d="M12 20L28 12L28 28L12 20z" fill={`url(#${id}-plane)`}/>
      </g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb"/>
          <stop offset="1" stopColor="#1e40af"/>
        </linearGradient>
        <linearGradient id={`${id}-plane`} x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff"/>
          <stop offset="1" stopColor="#c7d2fe"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const prefersDark = document.documentElement.classList.contains('dark');
    if (stored === 'dark' || (!stored && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3 hover:opacity-90">
            <span className="h-9 w-9 rounded-lg shrink-0 overflow-hidden block" aria-hidden>
              <LogoIcon className="h-full w-full" />
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">PrintPilot</span>
          </Link>
          {status === 'authenticated' && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {FEATURES.MVP_MODE ? 'Create Etsy Listing' : 'Dashboard'}
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">…</span>
          ) : session ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                {session.user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
