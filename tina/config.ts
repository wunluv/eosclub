import { defineConfig } from 'tinacms';

export default defineConfig({
  contentApiUrlOverride: process.env.TINA_SELF_HOSTED === 'true'
    ? '/api/tina/graphql'
    : undefined,
  branch: process.env.TINA_BRANCH || process.env.HEAD || 'main',
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || '',
  token: process.env.TINA_TOKEN || '',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'assets',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'pages',
        label: 'Pages',
        path: 'src/content/pages',
        format: 'md',
        fields: [
          { type: 'string', name: 'title', label: 'Page Title', required: true },
          { type: 'string', name: 'seoDescription', label: 'SEO Description', required: true },
          { type: 'image', name: 'ogImage', label: 'OG Image' },
          { type: 'string', name: 'translationSlug', label: 'Translation Slug', required: true },
          {
            type: 'object',
            name: 'blocks',
            label: 'Content Blocks',
            list: true,
            templates: [
              {
                name: 'HeroBlock',
                label: 'Hero Block',
                fields: [
                  { type: 'string', name: 'headline', label: 'Headline' },
                  {
                    type: 'string',
                    name: 'variant',
                    label: 'Hero Layout Variant',
                    options: [
                      { value: 'split-grid', label: 'Split + Image Grid (Home)' },
                      { value: 'cover', label: 'Cover / Background Image' },
                      { value: 'minimal', label: 'Minimal (Text Only)' },
                    ],
                  },
                  { type: 'string', name: 'subheadline', label: 'Subheadline' },
                  { type: 'image', name: 'backgroundImage', label: 'Background Image', required: true },
                  { type: 'image', name: 'logoOverlay', label: 'Logo Overlay (Centered)' },
                  { type: 'string', name: 'ctaLabel', label: 'CTA Label' },
                  { type: 'string', name: 'ctaUrl', label: 'CTA URL' },
                ],
              },
              {
                name: 'ContentBlock',
                label: 'Content Block',
                fields: [
                  { type: 'rich-text', name: 'body', label: 'Body Content', required: true },
                ],
              },
              {
                name: 'BookingBlock',
                label: 'Booking Block',
                fields: [
                  { type: 'boolean', name: 'enabled', label: 'Enabled', required: true },
                  { type: 'string', name: 'bookingUrl', label: 'bsport Booking URL', required: true },
                  { type: 'string', name: 'label', label: 'Section Label' },
                ],
              },
              {
                name: 'FeatureGridBlock',
                label: 'Feature Grid Block',
                fields: [
                  {
                    type: 'object',
                    name: 'items',
                    label: 'Features',
                    list: true,
                    fields: [
                      { type: 'string', name: 'icon', label: 'Feather Icon Name', required: true },
                      { type: 'string', name: 'title', label: 'Title', required: true },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                ],
              },
              {
                name: 'FullBleedBlock',
                label: 'Full Bleed Image Section',
                fields: [
                  { type: 'image', name: 'image', label: 'Background Image', required: true },
                  { type: 'string', name: 'altText', label: 'Alt Text' },
                  { type: 'string', name: 'minHeight', label: 'Min Height (Tailwind class, e.g. min-h-[50vh])' },
                  { type: 'string', name: 'overlayOpacity', label: 'Overlay Opacity (Tailwind class, e.g. opacity-50)' },
                  { type: 'string', name: 'headline', label: 'Headline (optional overlay text)' },
                  { type: 'string', name: 'subtext', label: 'Subtext (optional overlay text)' },
                ],
              },
              {
                name: 'InteractiveListBlock',
                label: 'Interactive List with Image Hover',
                fields: [
                  { type: 'string', name: 'title', label: 'Section Title' },
                  {
                    type: 'object',
                    name: 'items',
                    label: 'List Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'label', label: 'Label', required: true },
                      { type: 'string', name: 'description', label: 'Description' },
                      { type: 'image', name: 'image', label: 'Hover Image', required: true },
                      { type: 'string', name: 'imageAlt', label: 'Image Alt Text' },
                    ],
                  },
                ],
              },
              {
                name: 'FaqBlock',
                label: 'FAQ Accordion',
                fields: [
                  { type: 'string', name: 'title', label: 'Section Title' },
                  {
                    type: 'object',
                    name: 'questions',
                    label: 'Questions',
                    list: true,
                    fields: [
                      { type: 'string', name: 'question', label: 'Question', required: true },
                      { type: 'rich-text', name: 'answer', label: 'Answer', required: true },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
