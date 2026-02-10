'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface UsageData {
  tier: 'FREE' | 'PLUS';
  tools: readonly string[];
  limits: {
    mockupsPerMonth: number | null;
    etsyUploadsPerMonth: number | null;
    listingGensPerMonth: number | null;
  };
  usage: {
    mockupsUsedInPeriod: number;
    etsyUploadsUsedInPeriod: number;
    listingGensUsedInPeriod: number;
  };
  periodKey: string | null;
  plusTools: readonly string[];
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session?.user?.name !== undefined) {
      setName(session.user.name ?? '');
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (typeof window === 'undefined' || status !== 'authenticated') return;
    const params = new URLSearchParams(window.location.search);
    setShowUpgrade(params.get('upgrade') === '1');
    const result = params.get('upgrade');
    if (result === 'success') {
      setUpgradeMessage({ type: 'success', text: 'Welcome to Plus! Your account has been upgraded.' });
      update(); // refresh session tier
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (result === 'cancelled') {
      setUpgradeMessage({ type: 'info', text: 'Checkout was cancelled.' });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [status, update]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/user/usage', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => setUsage(null));
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Failed to update profile' });
        return;
      }
      await update({ user: { ...session.user, name: data.name ?? name.trim() } });
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated') return;
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.error ?? 'Failed to change password.' });
        return;
      }
      setPasswordMessage({ type: 'success', text: 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'authenticated' || !showDeleteConfirm) return;
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setDeleteMessage({ type: 'error', text: 'Type DELETE to confirm.' });
      return;
    }
    setDeleteSaving(true);
    setDeleteMessage(null);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteMessage({ type: 'error', text: data.error ?? 'Failed to delete account.' });
        setDeleteSaving(false);
        return;
      }
      await signOut({ callbackUrl: '/' });
    } catch {
      setDeleteMessage({ type: 'error', text: 'Something went wrong.' });
      setDeleteSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
        <div className="max-w-xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
        <div className="max-w-xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400">You must be signed in to view settings.</p>
        </div>
      </main>
    );
  }

  const isFree = (session.user as { tier?: string })?.tier === 'FREE';

  return (
    <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        {upgradeMessage && (
          <section
            className={`mb-8 p-4 rounded-xl border ${
              upgradeMessage.type === 'success'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200'
                : upgradeMessage.type === 'error'
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200'
            }`}
          >
            <p className="text-sm">{upgradeMessage.text}</p>
          </section>
        )}

        {showUpgrade && isFree && (
          <section className="mb-8 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Upgrade to Plus</h2>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Unlock Bulk Edit, Listing Templates, and Inventory. Get unlimited mockups, Etsy uploads, and listing generations every month.
            </p>
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={async () => {
                setCheckoutLoading(true);
                setUpgradeMessage(null);
                try {
                  const res = await fetch('/api/stripe/checkout', { method: 'POST', credentials: 'include' });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setUpgradeMessage({ type: 'error', text: data.error ?? 'Failed to start checkout' });
                    return;
                  }
                  if (data.url) window.location.href = data.url;
                  else setUpgradeMessage({ type: 'error', text: 'Invalid checkout response' });
                } catch {
                  setUpgradeMessage({ type: 'error', text: 'Something went wrong.' });
                } finally {
                  setCheckoutLoading(false);
                }
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {checkoutLoading ? 'Redirecting to checkout…' : 'Subscribe to Plus with Stripe'}
            </button>
          </section>
        )}

        {usage && isFree && (
          <section className="mb-10 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Free tier usage</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Resets monthly. Current period: <strong>{usage.periodKey ?? '—'}</strong>
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mockups</span>
                <span>{usage.usage.mockupsUsedInPeriod} / {usage.limits.mockupsPerMonth ?? '∞'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Etsy uploads</span>
                <span>{usage.usage.etsyUploadsUsedInPeriod} / {usage.limits.etsyUploadsPerMonth ?? '∞'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Listing generations</span>
                <span>{usage.usage.listingGensUsedInPeriod} / {usage.limits.listingGensPerMonth ?? '∞'}</span>
              </li>
            </ul>
            <Link
              href="/dashboard/settings?upgrade=1"
              className="inline-block mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Upgrade to Plus →
            </Link>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={session.user?.email ?? ''}
                readOnly
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed here.
              </p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Display name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Change password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            {passwordMessage && (
              <p
                className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {passwordMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Plan</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Current plan: <strong>{(session.user as { tier?: string })?.tier === 'PLUS' ? 'Plus' : 'Free'}</strong>
          </p>
          {(session.user as { tier?: string })?.tier === 'PLUS' && (
            <button
              type="button"
              disabled={portalLoading}
              onClick={async () => {
                setPortalLoading(true);
                setUpgradeMessage(null);
                try {
                  const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setUpgradeMessage({ type: 'error', text: data.error ?? 'Failed to open billing portal' });
                    return;
                  }
                  if (data.url) window.location.href = data.url;
                } catch {
                  setUpgradeMessage({ type: 'error', text: 'Something went wrong.' });
                } finally {
                  setPortalLoading(false);
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </button>
          )}
        </section>

        <section className="border-t border-gray-200 dark:border-gray-700 pt-10">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Delete account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              I want to delete my account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Your password
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="deleteConfirm" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  id="deleteConfirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              {deleteMessage && (
                <p
                  className={`text-sm ${deleteMessage.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  {deleteMessage.text}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                    setDeleteConfirm('');
                    setDeleteMessage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteSaving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteSaving ? 'Deleting…' : 'Delete my account'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
