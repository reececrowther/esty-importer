import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { canUseTool } from '@/lib/tierConstants';

export default async function BulkEditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/dashboard');
  if (!canUseTool(session.user.tier ?? 'FREE', 'bulk-edit')) {
    redirect('/dashboard/settings?upgrade=1');
  }
  return (
    <main className="min-h-screen p-8 md:p-10 lg:p-12 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Bulk Edit</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Edit multiple listings at once. This tool is coming soon.
        </p>
        <div className="mt-8 p-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-center text-gray-500 dark:text-gray-400">
          Placeholder — Bulk Edit will be available in a future update.
        </div>
      </div>
    </main>
  );
}
