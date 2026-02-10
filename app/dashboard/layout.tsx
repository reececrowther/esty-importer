import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }
  return (
    <div className="flex">
      <DashboardSidebar tier={session.user.tier ?? 'FREE'} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
