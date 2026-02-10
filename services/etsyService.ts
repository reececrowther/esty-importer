/**
 * Etsy Service
 *
 * Handles Etsy API integration for uploading listings.
 *
 * For SaaS scaling:
 * - Store OAuth tokens per user
 * - Handle token refresh
 * - Implement rate limiting
 * - Queue uploads for batch processing
 * - Track listing status and sync updates
 */

import { EtsyListing } from '@/types';

const ETSY_API_BASE = 'https://api.etsy.com/v3';
const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_SHARED_SECRET = process.env.ETSY_SHARED_SECRET;

function getApiKeyHeader(): string {
  if (ETSY_SHARED_SECRET) {
    return `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}`;
  }
  return ETSY_API_KEY ?? '';
}

export interface EtsyUploadOptions {
  listing: EtsyListing;
  accessToken?: string;
  shopId: number;
  /** If true, listing goes live immediately; otherwise saved as draft */
  publish?: boolean;
}

/**
 * Upload a listing to Etsy: create draft, upload images, then optionally publish.
 * accessToken is required for real uploads; without it returns a stub response.
 */
export async function uploadListingToEtsy(
  options: EtsyUploadOptions
): Promise<{ listingId: string; url: string }> {
  const { listing, accessToken, shopId, publish = false } = options;

  if (!accessToken) {
    console.log('[STUB] Would upload listing to Etsy:', {
      title: listing.title,
      imageCount: listing.images.length,
    });
    return {
      listingId: `stub-${Date.now()}`,
      url: `https://etsy.com/listing/stub-${Date.now()}`,
    };
  }

  const apiKey = getApiKeyHeader();
  if (!apiKey) {
    throw new Error('Etsy API key not configured (ETSY_API_KEY)');
  }

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    Authorization: `Bearer ${accessToken}`,
  };

  // 1. Create listing (draft or active). Etsy requires a price; default 1.00 for draft.
  const createBody = {
    title: listing.title.slice(0, 140),
    description: listing.description,
    quantity: listing.quantity ?? 1,
    listing_type: 'physical',
    state: publish ? 'active' : 'draft',
    price: (listing.price ?? 0) > 0 ? Number(listing.price) : 1.0,
    tags: listing.tags?.slice(0, 13) ?? [],
  };

  const createRes = await fetch(
    `${ETSY_API_BASE}/application/shops/${shopId}/listings`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Etsy create listing error:', createRes.status, errText);
    throw new Error(`Etsy create listing failed: ${createRes.status}`);
  }

  const listingData = (await createRes.json()) as { listing_id: number };
  const listingId = String(listingData.listing_id);

  // 2. Upload images (fetch from our URLs and upload to Etsy)
  for (let i = 0; i < listing.images.length; i++) {
    const imageUrl = listing.images[i];
    await uploadImageToEtsy(shopId, listingId, imageUrl, accessToken, headers);
  }

  const url = `https://www.etsy.com/listing/${listingId}`;
  return { listingId, url };
}

/**
 * Fetch image from URL (e.g. our /api/files/...) and upload to Etsy listing.
 */
async function uploadImageToEtsy(
  shopId: number,
  listingId: string,
  imageUrl: string,
  accessToken: string,
  baseHeaders: Record<string, string>
): Promise<void> {
  const resolvedUrl =
    imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  let imageBuffer: ArrayBuffer;
  try {
    const res = await fetch(resolvedUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    imageBuffer = await res.arrayBuffer();
  } catch (e) {
    console.error('Failed to fetch image for Etsy:', resolvedUrl, e);
    throw new Error('Failed to load image for upload');
  }

  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  form.append('image', blob, 'image.jpg');

  const uploadRes = await fetch(
    `${ETSY_API_BASE}/application/shops/${shopId}/listings/${listingId}/images`,
    {
      method: 'POST',
      headers: {
        'x-api-key': baseHeaders['x-api-key'],
        Authorization: baseHeaders.Authorization,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('Etsy image upload error:', uploadRes.status, errText);
    throw new Error(`Etsy image upload failed: ${uploadRes.status}`);
  }
}
