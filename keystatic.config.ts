import { config, fields, collection } from '@keystatic/core';

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          repo: (process.env.PUBLIC_GITHUB_REPO as any) || 'wunluv/eosclub',
        }
      : {
          kind: 'local',
        },
  collections: {
    pages: collection({
      label: 'Pages',
      slugField: 'title',
      path: 'src/content/pages/**',
      format: {
        data: 'yaml',
        contentField: 'content',
      },
      schema: {
        title: fields.slug({
          name: { label: 'Page Title' },
        }),
        seoDescription: fields.text({ label: 'SEO Description' }),
        ogImage: fields.image({
          label: 'OG Image',
          directory: 'public/assets',
          publicPath: '/assets/',
        }),
        translationSlug: fields.text({ label: 'Translation Slug' }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
        blocks: fields.blocks(
          {
            HeroBlock: {
              label: 'Hero Block',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                headline: fields.text({ label: 'Headline' }),
                variant: fields.select({
                  label: 'Hero Layout Variant',
                  options: [
                    { value: 'split-grid', label: 'Split + Image Grid (Home)' },
                    { value: 'cover', label: 'Cover / Background Image' },
                    { value: 'minimal', label: 'Minimal (Text Only)' },
                  ],
                  defaultValue: 'split-grid',
                }),
                subheadline: fields.text({ label: 'Subheadline' }),
                subBodyText: fields.text({ label: 'Sub-body Text' }),
                backgroundImage: fields.image({
                  label: 'Background Image',
                  directory: 'public/assets',
                  publicPath: '/assets/',
                }),
                logoOverlay: fields.image({
                  label: 'Logo Overlay (Centered)',
                  directory: 'public/assets',
                  publicPath: '/assets/',
                }),
                ctaLabel: fields.text({ label: 'CTA Label' }),
                ctaUrl: fields.text({ label: 'CTA URL' }),
              }),
            },
            ContentBlock: {
              label: 'Content Block',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                body: fields.text({ label: 'Body Content', multiline: true }),
                fullBleed: fields.checkbox({ label: 'Full Bleed Layout' }),
                backgroundImage: fields.image({
                  label: 'Background Image',
                  directory: 'public/assets',
                  publicPath: '/assets/',
                }),
              }),
            },
            BookingBlock: {
              label: 'Booking Block',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                enabled: fields.checkbox({ label: 'Enabled' }),
                bookingUrl: fields.text({ label: 'bsport Booking URL' }),
                label: fields.text({ label: 'Section Label' }),
              }),
            },
            FeatureGridBlock: {
              label: 'Feature Grid Block',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                items: fields.array(
                  fields.object({
                    icon: fields.text({ label: 'Feather Icon Name' }),
                    title: fields.text({ label: 'Title' }),
                    description: fields.text({ label: 'Description' }),
                  }),
                  {
                    label: 'Features',
                    itemLabel: (props) => props.fields.title.value || 'New Feature',
                  }
                ),
              }),
            },
            FullBleedBlock: {
              label: 'Full Bleed Image Section',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                image: fields.image({
                  label: 'Background Image',
                  directory: 'public/assets',
                  publicPath: '/assets/',
                }),
                altText: fields.text({ label: 'Alt Text' }),
                minHeight: fields.text({ label: 'Min Height (Tailwind class, e.g. min-h-[50vh])' }),
                overlayOpacity: fields.text({ label: 'Overlay Opacity (Tailwind class, e.g. opacity-50)' }),
                headline: fields.text({ label: 'Headline (optional overlay text)' }),
                subtext: fields.text({ label: 'Subtext (optional overlay text)' }),
              }),
            },
            InteractiveListBlock: {
              label: 'Interactive List with Image Hover',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                title: fields.text({ label: 'Section Title' }),
                items: fields.array(
                  fields.object({
                    label: fields.text({ label: 'Label' }),
                    description: fields.text({ label: 'Description' }),
                    image: fields.image({
                      label: 'Hover Image',
                      directory: 'public/assets',
                      publicPath: '/assets/',
                    }),
                    imageAlt: fields.text({ label: 'Image Alt Text' }),
                  }),
                  {
                    label: 'List Items',
                    itemLabel: (props) => props.fields.label.value || 'New Item',
                  }
                ),
              }),
            },
            FaqBlock: {
              label: 'FAQ Accordion',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                title: fields.text({ label: 'Section Title' }),
                questions: fields.array(
                  fields.object({
                    question: fields.text({ label: 'Question' }),
                    answer: fields.text({ label: 'Answer', multiline: true }),
                  }),
                  {
                    label: 'Questions',
                    itemLabel: (props) => props.fields.question.value || 'New Question',
                  }
                ),
              }),
            },
            BsportCalendar: {
              label: 'bsport: Calendar',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                elementId: fields.text({ label: 'Unique Element ID' }),
              }),
            },
            BsportPasses: {
              label: 'bsport: Passes',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                elementId: fields.text({ label: 'Unique Element ID' }),
              }),
            },
            BsportSubscription: {
              label: 'bsport: Subscriptions',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                elementId: fields.text({ label: 'Unique Element ID' }),
              }),
            },
          },
          { label: 'Content Blocks' }
        ),
      },
    }),
  },
});
