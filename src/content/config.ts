import { defineCollection, z } from 'astro:content';

// Block schemas
const heroBlockSchema = z.object({
  _template: z.literal('HeroBlock'),
  headline: z.string(),
  subheadline: z.string().optional(),
  subBodyText: z.string().optional(),
  backgroundImage: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});

const contentBlockSchema = z.object({
  _template: z.literal('ContentBlock'),
  body: z.string(),
});

const bookingBlockSchema = z.object({
  _template: z.literal('BookingBlock'),
  enabled: z.boolean().default(true),
  bookingUrl: z.string(),
  label: z.string().optional(),
});

const featureGridBlockSchema = z.object({
  _template: z.literal('FeatureGridBlock'),
  items: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })),
});

// Discriminated union for all blocks
const blockSchema = z.discriminatedUnion('_template', [
  heroBlockSchema,
  contentBlockSchema,
  bookingBlockSchema,
  featureGridBlockSchema,
]);

// Pages collection
const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    seoDescription: z.string(),
    ogImage: z.string().optional(),
    translationSlug: z.string(),
    blocks: z.array(blockSchema).optional(),
  }),
});

export const collections = { pages };
