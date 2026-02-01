import { NextRequest, NextResponse } from 'next/server';
import { uploadListingToEtsy } from '@/services/etsyService';
import { EtsyListing } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing } = body as { listing: EtsyListing };

    const result = await uploadListingToEtsy({
      listing,
      // In production, accessToken would come from authenticated user session
      accessToken: undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Etsy upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Etsy' },
      { status: 500 }
    );
  }
}
