'use client';

import { useState, useEffect } from 'react';

export default function EtsyStoreSettingsPage() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkConnection = () => {
    return fetch('/api/etsy/connect', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setConnected(Boolean(data.connected));
        return data;
      })
      .catch(() => {
        setConnected(false);
        return { connected: false };
      })
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // After OAuth redirect (?etsy=connected or ?etsy=error), refetch and clean URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const etsy = params.get('etsy');
    if (etsy === 'connected' || etsy === 'error') {
      params.delete('etsy');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      if (etsy === 'connected') {
        checkConnection().then((data) => {
          if (data.connected) alert('Etsy store connected. You can now upload listings.');
        });
      } else {
        alert('Etsy connection failed. Please try again.');
      }
    }
  }, []);

  const handleDisconnect = async () => {
    try {
      await fetch('/api/etsy/disconnect', { method: 'POST', credentials: 'include' });
      setConnected(false);
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Etsy store</h1>

        <section className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Connect your Etsy shop</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your Etsy shop to publish listings and upload images from PrintPilot.
          </p>
          {checking ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Checking connection…</p>
          ) : connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Etsy connected</span>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-sm px-3 py-1.5 border border-gray-400 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a
              href="/api/etsy/auth?returnTo=/dashboard/settings/etsy"
              className="inline-block text-sm px-4 py-2.5 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Connect Etsy store
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
