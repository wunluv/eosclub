import { defineCollection, z } from 'astro:content';

// Block schemas
const heroBlockSchema = z.object({
  _template: z.literal('HeroBlock'),
  name: z.string().optional(),
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
  name: z.string().optional(),
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
  name: z.string().optional(),
  title: z.string().optional(),
  items: z.array(interactiveListItemSchema),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const faqBlockSchema = z.object({
  _template: z.literal('FaqBlock'),
  name: z.string().optional(),
  title: z.string().optional(),
  questions: z.array(faqItemSchema),
});

const contentBlockSchema = z.object({
  _template: z.literal('ContentBlock'),
  name: z.string().optional(),
  body: z.string(),
  backgroundImage: z.string().optional(),
  fullBleed: z.boolean().optional().default(false),
});

const bookingBlockSchema = z.object({
  _template: z.literal('BookingBlock'),
  name: z.string().optional(),
  enabled: z.boolean().default(true),
  bookingUrl: z.string(),
  label: z.string().optional(),
});

const featureGridBlockSchema = z.object({
  _template: z.literal('FeatureGridBlock'),
  name: z.string().optional(),
  items: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })),
});

const bsportCalendarBlockSchema = z.object({
  _template: z.literal('BsportCalendar'),
  name: z.string().optional(),
});

const bsportPassesBlockSchema = z.object({
  _template: z.literal('BsportPasses'),
  name: z.string().optional(),
});

const bsportSubscriptionBlockSchema = z.object({
  _template: z.literal('BsportSubscription'),
  name: z.string().optional(),
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
  bsportCalendarBlockSchema,
  bsportPassesBlockSchema,
  bsportSubscriptionBlockSchema,
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
