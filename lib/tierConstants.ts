import type { Tier } from '@prisma/client';

/**
 * Client-safe tier limits and helpers (no Prisma).
 * Use lib/tiers.ts for server-side usage/DB operations.
 */
export const TIER_LIMITS = {
  FREE: {
    mockupsPerMonth: 50,
    etsyUploadsPerMonth: 3,
    listingGensPerMonth: 10,
    tools: ['etsy-importer'] as const,
  },
  PLUS: {
    mockupsPerMonth: Infinity,
    etsyUploadsPerMonth: Infinity,
    listingGensPerMonth: Infinity,
    tools: ['etsy-importer', 'bulk-edit', 'listing-templates', 'inventory'] as const,
  },
} as const;

export type FreeToolSlug = (typeof TIER_LIMITS.FREE.tools)[number];
export type PlusToolSlug = (typeof TIER_LIMITS.PLUS.tools)[number];

export function getLimitsForTier(tier: Tier) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;
}

export function canUseTool(tier: Tier, toolSlug: string): boolean {
  const limits = getLimitsForTier(tier);
  return (limits.tools as readonly string[]).includes(toolSlug);
}
