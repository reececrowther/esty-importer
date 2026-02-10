'use client';

import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const RATING_LABELS = ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];
const RATING_EMOJI = ['😞', '😕', '😐', '🙂', '😊'];

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const pathname = usePathname();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [allowContact, setAllowContact] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const resetForm = useCallback(() => {
    setRating(null);
    setMessage('');
    setAllowContact(false);
    setStatus('idle');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    titleRef.current?.focus({ preventScroll: true });
  }, [isOpen, resetForm]);

  // Restore scroll when modal closes so we never leave body locked
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  // Safety: always restore body overflow on unmount (e.g. navigation while modal open)
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(handleClose, 2200);
    return () => clearTimeout(t);
  }, [status, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating == null) {
      setError('Please select a rating.');
      return;
    }
    setError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          message: message.trim() || undefined,
          route: pathname ?? '/',
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          allowContact,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      data-feedback-modal="overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-desc"
    >
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/50 backdrop-blur-[2px]"
        aria-hidden
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="text-4xl" aria-hidden>🙏</span>
            <h2 id="feedback-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Thank you!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your feedback helps us improve PrintPilot.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <h2
              id="feedback-modal-title"
              ref={titleRef}
              tabIndex={-1}
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Help us improve PrintPilot
            </h2>
            <p id="feedback-modal-desc" className="sr-only">
              Rate your experience and optionally leave a message.
            </p>

            <div>
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                How was your experience?
              </span>
              <div className="flex gap-2" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border text-lg transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-gray-500 ${
                      rating === value
                        ? 'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-700'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500'
                    }`}
                    title={RATING_LABELS[value - 1]}
                    aria-pressed={rating === value}
                    aria-label={RATING_LABELS[value - 1]}
                  >
                    {RATING_EMOJI[value - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="feedback-message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Comments (optional)
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What worked well? What could be better?"
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-gray-500 dark:focus:ring-gray-500/20"
                disabled={status === 'submitting'}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={allowContact}
                onChange={(e) => setAllowContact(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-400 dark:border-gray-500 dark:bg-gray-700 dark:focus:ring-gray-500"
                disabled={status === 'submitting'}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Allow us to contact you about this feedback
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus:ring-gray-500"
              >
                {status === 'submitting' ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
