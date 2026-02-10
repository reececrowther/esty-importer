import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { loadFeedbackFromFile } from '@/lib/feedbackStorage';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/dashboard/admin');
  }
  if (!isAdmin(session)) {
    redirect('/dashboard');
  }

  const [users, feedback] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        mockupsUsedInPeriod: true,
        etsyUploadsUsedInPeriod: true,
        listingGensUsedInPeriod: true,
        usagePeriodMonth: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    loadFeedbackFromFile(),
  ]);

  return (
    <AdminDashboard
      users={users}
      feedback={feedback}
    />
  );
}
