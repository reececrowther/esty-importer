import { NextRequest, NextResponse } from 'next/server';
import { generateListingContent } from '@/services/aiListingService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      designDescription,
      productType,
      keywords,
      mockupCount,
    } = body;

    const listingContent = await generateListingContent({
      designDescription,
      productType,
      keywords,
      mockupDescriptions: [`${mockupCount} mockup${mockupCount > 1 ? 's' : ''}`],
    });

    return NextResponse.json(listingContent);
  } catch (error) {
    console.error('Listing generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate listing content' },
      { status: 500 }
    );
  }
}
