import type { FeedbackPayload } from '@/lib/feedbackStorage';
import type { Tier } from '@prisma/client';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  tier: Tier;
  mockupsUsedInPeriod: number;
  etsyUploadsUsedInPeriod: number;
  listingGensUsedInPeriod: number;
  usagePeriodMonth: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminDashboardProps = {
  users: UserRow[];
  feedback: FeedbackPayload[];
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AdminDashboard({ users, feedback }: AdminDashboardProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Users and feedback (only visible to you).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Users ({users.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usage (period)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="text-sm">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {u.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.tier === 'PLUS'
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }
                    >
                      {u.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {u.usagePeriodMonth ?? '—'} — M: {u.mockupsUsedInPeriod}, E:{' '}
                    {u.etsyUploadsUsedInPeriod}, L: {u.listingGensUsedInPeriod}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Feedback ({feedback.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allow contact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No feedback yet.
                  </td>
                </tr>
              ) : (
                [...feedback].reverse().map((f, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {f.timestamp
                        ? formatDate(new Date(f.timestamp))
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {f.rating}/5
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {f.route}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                      {f.message ? (
                        <span className="block truncate" title={f.message}>
                          {f.message}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {f.allowContact ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
