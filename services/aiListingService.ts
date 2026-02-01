/**
 * AI Listing Service
 * 
 * Generates Etsy-optimized content using OpenAI API.
 * 
 * For SaaS scaling:
 * - Add rate limiting per user
 * - Cache common prompts/results
 * - Track usage for billing
 * - Support multiple AI providers
 */

import OpenAI from 'openai';
import { ListingContent } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateListingOptions {
  designDescription?: string;
  mockupDescriptions?: string[];
  productType?: string;
  keywords?: string[];
}

/**
 * Generate Etsy-optimized listing content
 * 
 * SaaS scaling: Add user context, rate limiting, usage tracking
 */
export async function generateListingContent(
  options: GenerateListingOptions = {}
): Promise<ListingContent> {
  const {
    designDescription = 'a beautiful design',
    mockupDescriptions = [],
    productType = 'digital product',
    keywords = [],
  } = options;

  const prompt = buildListingPrompt({
    designDescription,
    mockupDescriptions,
    productType,
    keywords,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert Etsy SEO specialist. Generate optimized listing content that:
- Uses relevant keywords naturally
- Is engaging and conversion-focused
- Follows Etsy best practices
- Includes proper formatting`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    return parseListingContent(content);
  } catch (error) {
    console.error('Error generating listing content:', error);
    throw new Error('Failed to generate listing content');
  }
}

function buildListingPrompt(options: GenerateListingOptions): string {
  const { designDescription, mockupDescriptions, productType, keywords } = options;

  return `Generate Etsy-optimized listing content for a ${productType}.

Design description: ${designDescription}
${mockupDescriptions.length > 0 ? `Mockup types: ${mockupDescriptions.join(', ')}` : ''}
${keywords.length > 0 ? `Keywords to include: ${keywords.join(', ')}` : ''}

Please provide:
1. A compelling title (under 140 characters, keyword-rich)
2. A detailed description (500-2000 words, well-formatted with line breaks)
3. 13 relevant tags (Etsy allows up to 13 tags, comma-separated)

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
  const tags = tagsMatch?.[1]
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 13) || [];

  return {
    title,
    description,
    tags,
  };
}
