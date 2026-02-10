import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
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
  });
  return NextResponse.json(users);
}
