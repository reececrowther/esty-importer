import { prisma } from './prisma';
import { Tier } from '@prisma/client';
import { TIER_LIMITS, getLimitsForTier } from './tierConstants';

export { TIER_LIMITS };
export type { FreeToolSlug, PlusToolSlug } from './tierConstants';
export { canUseTool, getLimitsForTier } from './tierConstants';

export function getCurrentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getUserWithUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tier: true,
      usagePeriodMonth: true,
      mockupsUsedInPeriod: true,
      etsyUploadsUsedInPeriod: true,
      listingGensUsedInPeriod: true,
    },
  });
  if (!user) return null;

  const period = getCurrentPeriodKey();
  if (user.usagePeriodMonth !== period) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        usagePeriodMonth: period,
        mockupsUsedInPeriod: 0,
        etsyUploadsUsedInPeriod: 0,
        listingGensUsedInPeriod: 0,
      },
    });
    return {
      ...user,
      usagePeriodMonth: period,
      mockupsUsedInPeriod: 0,
      etsyUploadsUsedInPeriod: 0,
      listingGensUsedInPeriod: 0,
    };
  }
  return user;
}

export async function checkMockupLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await getUserWithUsage(userId);
  if (!user) return { allowed: false, used: 0, limit: 0 };
  const limits = getLimitsForTier(user.tier);
  const limit = limits.mockupsPerMonth;
  const used = user.mockupsUsedInPeriod;
  return { allowed: used < limit, used, limit };
}

export async function checkEtsyUploadLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await getUserWithUsage(userId);
  if (!user) return { allowed: false, used: 0, limit: 0 };
  const limits = getLimitsForTier(user.tier);
  const limit = limits.etsyUploadsPerMonth;
  const used = user.etsyUploadsUsedInPeriod;
  return { allowed: used < limit, used, limit };
}

export async function checkListingGenLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await getUserWithUsage(userId);
  if (!user) return { allowed: false, used: 0, limit: 0 };
  const limits = getLimitsForTier(user.tier);
  const limit = limits.listingGensPerMonth;
  const used = user.listingGensUsedInPeriod;
  return { allowed: used < limit, used, limit };
}

export async function incrementMockupUsage(userId: string): Promise<void> {
  const period = getCurrentPeriodKey();
  await prisma.user.update({
    where: { id: userId },
    data: {
      usagePeriodMonth: period,
      mockupsUsedInPeriod: { increment: 1 },
    },
  });
}

export async function incrementEtsyUploadUsage(userId: string): Promise<void> {
  const period = getCurrentPeriodKey();
  await prisma.user.update({
    where: { id: userId },
    data: {
      usagePeriodMonth: period,
      etsyUploadsUsedInPeriod: { increment: 1 },
    },
  });
}

export async function incrementListingGenUsage(userId: string): Promise<void> {
  const period = getCurrentPeriodKey();
  await prisma.user.update({
    where: { id: userId },
    data: {
      usagePeriodMonth: period,
      listingGensUsedInPeriod: { increment: 1 },
    },
  });
}
