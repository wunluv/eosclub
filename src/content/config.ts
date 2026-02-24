import { defineCollection, z } from 'astro:content';

// Block schemas
const heroBlockSchema = z.object({
  _template: z.literal('HeroBlock'),
  variant: z.enum(['split-grid', 'cover', 'minimal']).optional().default('split-grid'),
  headline: z.string(),
  subheadline: z.string().optional(),
  subBodyText: z.string().optional(),
  backgroundImage: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});

const fullBleedBlockSchema = z.object({
  _template: z.literal('FullBleedBlock'),
  image: z.string(),
  altText: z.string().optional(),
  minHeight: z.string().optional(),
  overlayOpacity: z.string().optional(),
  headline: z.string().optional(),
  subtext: z.string().optional(),
});

const interactiveListItemSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  image: z.string(),
  imageAlt: z.string().optional(),
});

const interactiveListBlockSchema = z.object({
  _template: z.literal('InteractiveListBlock'),
  title: z.string().optional(),
  items: z.array(interactiveListItemSchema),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const faqBlockSchema = z.object({
  _template: z.literal('FaqBlock'),
  title: z.string().optional(),
  questions: z.array(faqItemSchema),
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
  fullBleedBlockSchema,
  interactiveListBlockSchema,
  faqBlockSchema,
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
