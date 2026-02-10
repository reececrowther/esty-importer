/**
 * AI Listing Service
 *
 * Generates Etsy-optimized content using OpenRouter (or OpenAI).
 * OpenRouter: https://openrouter.ai — single API for many models (GPT-4, Claude, etc.).
 *
 * For SaaS scaling:
 * - Add rate limiting per user
 * - Cache common prompts/results
 * - Track usage for billing
 * - Support multiple AI providers
 */

import OpenAI from 'openai';
import { ListingContent } from '@/types';

const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
const apiKey = useOpenRouter
  ? process.env.OPENROUTER_API_KEY
  : process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey,
  ...(useOpenRouter && {
    baseURL: 'https://openrouter.ai/api/v1',
  }),
});

const defaultModel = useOpenRouter
  ? (process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free')
  : 'gpt-4';

/** When imageUrls are provided on OpenRouter, use a free vision-capable model (Trinity is text-only). */
function getModelForRequest(hasImages: boolean): string {
  if (hasImages && useOpenRouter) {
    return process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free';
  }
  return defaultModel;
}

export interface GenerateListingOptions {
  designDescription?: string;
  mockupDescriptions?: string[];
  productType?: string;
  keywords?: string[];
  /** Image URLs (mockup/artwork) for vision-based generation. Server will fetch and send as base64. */
  imageUrls?: string[];
}

/**
 * Generate Etsy-optimized listing content
 * 
 * SaaS scaling: Add user context, rate limiting, usage tracking
 */
/**
 * Fetch image from URL and return as base64 data URL (for vision API).
 * Supports same-origin and localhost URLs that the server can fetch.
 */
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/png';
  const mime = contentType.split(';')[0].trim();
  return `data:${mime};base64,${base64}`;
}

/**
 * Generate Etsy-optimized listing content
 *
 * When imageUrls are provided, uses vision to describe the artwork and generate title, description, and tags.
 * Requires a vision-capable model (e.g. openai/gpt-4o-mini, google/gemini-2.0-flash). Set OPENROUTER_MODEL if needed.
 */
export async function generateListingContent(
  options: GenerateListingOptions = {}
): Promise<ListingContent> {
  const {
    designDescription = 'a beautiful design',
    mockupDescriptions = [],
    productType = 'digital product',
    keywords = [],
    imageUrls = [],
  } = options;

  const prompt = buildListingPrompt({
    designDescription,
    mockupDescriptions,
    productType,
    keywords,
  });

  const hasImages = imageUrls.length > 0;
  const imageDataUrls: string[] = [];
  if (hasImages) {
    for (const url of imageUrls.slice(0, 5)) {
      try {
        imageDataUrls.push(await fetchImageAsDataUrl(url));
      } catch (e) {
        console.warn('Could not fetch image for listing generation:', url, e);
      }
    }
  }

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
    imageDataUrls.length > 0
      ? [
          { type: 'text', text: prompt },
          ...imageDataUrls.map(
            (dataUrl): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
              type: 'image_url',
              image_url: { url: dataUrl },
            })
          ),
        ]
      : [{ type: 'text', text: prompt }];

  const systemContent = hasImages
    ? `You are an expert Etsy SEO specialist. You will be shown image(s) of the seller's product/artwork (e.g. mockups or designs). Use the images to understand what the product looks like, then generate optimized listing content that:
- Accurately describes what is shown in the images
- Uses relevant keywords naturally
- Is engaging and conversion-focused
- Follows Etsy best practices
- Includes proper formatting`
    : `You are an expert Etsy SEO specialist. Generate optimized listing content that:
- Uses relevant keywords naturally
- Is engaging and conversion-focused
- Follows Etsy best practices
- Includes proper formatting`;

  try {
    const completion = await client.chat.completions.create({
      model: getModelForRequest(hasImages),
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent.length === 1 && userContent[0].type === 'text' ? userContent[0].text : userContent },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    return parseListingContent(content);
  } catch (error: unknown) {
    console.error('Error generating listing content:', error);
    const status = (error as { status?: number })?.status;
    const apiMessage = (error as { message?: string })?.message ?? '';
    if (status === 404) {
      throw new Error(
        'Vision model not found. Set OPENROUTER_VISION_MODEL in .env to a vision-capable model (e.g. google/gemini-2.0-flash-001).'
      );
    }
    if (status === 402) {
      throw new Error(
        'Insufficient OpenRouter credits. Add credits at https://openrouter.ai/settings/credits or set OPENROUTER_VISION_MODEL to a free model.'
      );
    }
    throw new Error(apiMessage || 'Failed to generate listing content');
  }
}

function buildListingPrompt(options: GenerateListingOptions): string {
  const {
    designDescription = 'a beautiful design',
    mockupDescriptions = [],
    productType = 'digital product',
    keywords = [],
  } = options;

  return `Generate Etsy-optimized listing content for a ${productType}.

Design description: ${designDescription}
${mockupDescriptions.length > 0 ? `Mockup types: ${mockupDescriptions.join(', ')}` : ''}
${keywords.length > 0 ? `Keywords to include: ${keywords.join(', ')}` : ''}

Please provide:
1. A compelling title (under 140 characters, keyword-rich)
2. A detailed description (500-2000 words, well-formatted with line breaks)
3. 13 relevant tags (Etsy allows up to 13 tags, comma-separated; each tag must be 20 characters or fewer)

Format your response as:
TITLE: [title here]
DESCRIPTION: [description here]
TAGS: [tag1, tag2, tag3, ...]`;
}

function parseListingContent(content: string): ListingContent {
  const titleMatch = content.match(/TITLE:\s*(.+?)(?=\n|DESCRIPTION:)/is);
  const descriptionMatch = content.match(/DESCRIPTION:\s*(.+?)(?=\n|TAGS:)/is);
  const tagsMatch = content.match(/TAGS:\s*(.+?)$/is);

  const title = titleMatch?.[1]?.trim() || 'Untitled Listing';
  const description = descriptionMatch?.[1]?.trim() || 'No description available';
  const ETSY_TAG_MAX_LEN = 20;
  const tags = (tagsMatch?.[1]
    ?.split(',')
    .map((tag) => tag.trim().slice(0, ETSY_TAG_MAX_LEN))
    .filter(Boolean)
    .slice(0, 13)) || [];

  return {
    title,
    description,
    tags,
  };
}
