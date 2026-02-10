import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/ui/Header';
import SessionProvider from '@/components/providers/SessionProvider';
import FeedbackButton from '@/components/feedback/FeedbackButton';

export const metadata: Metadata = {
  title: 'PrintPilot — Etsy Listing Automation for Print & Poster Sellers',
  description: 'Turn your artwork into ready-to-sell Etsy listings in seconds. Automatically generate mockups, SEO titles, descriptions, and tags — built for print and poster sellers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('esty-importer-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col text-gray-900 dark:text-gray-100 antialiased">
        <SessionProvider>
          <div className="shrink-0">
            <Header />
          </div>
          <main className="flex-1 min-h-0 overflow-auto">
            {children}
          </main>
          <FeedbackButton />
        </SessionProvider>
      </body>
    </html>
  );
}
