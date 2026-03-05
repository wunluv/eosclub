import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: 'eos-club/eosclub',
  },
  collections: {
    pages: collection({
      label: 'Pages',
      slugField: 'title',
      path: 'src/content/pages/**',
      format: {
        data: 'yaml',
        // contentField is required so Keystatic discovers .md files (not .yaml).
        // fields.emptyContent() satisfies the ContentFormField type without
        // showing any WYSIWYG editor — the markdown body is intentionally empty.
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
        // emptyContent tells Keystatic the file is .md but has no editable body.
        // This resolves the P2 "orphan content field" issue — editors no longer
        // see a disconnected WYSIWYG field.
        content: fields.emptyContent({ extension: 'md' }),
        // Each block schema is wrapped with fields.object() to satisfy the
        // ComponentSchema type constraint of fields.blocks(). Image path fields
        // use fields.text() (plain string) since fields.image() inside
        // fields.object() inside fields.blocks() has known crashing issues
        // in @keystar/ui@0.7.x (formKind: "asset" triggers assertNever).
        blocks: fields.blocks(
          {
            HeroBlock: {
              label: 'Hero Block',
              schema: fields.object({
                name: fields.text({ label: 'Section Name (internal reference)' }),
                headline: fields.text({ label: 'Headline', multiline: true }),
                variant: fields.select({
                  label: 'Hero Layout Variant',
                  options: [
                    { value: 'split-grid', label: 'Split + Image Grid (Home)' },
                    { value: 'cover', label: 'Cover / Background Image' },
                    { value: 'minimal', label: 'Minimal (Text Only)' },
                  ],
                  defaultValue: 'split-grid',
                }),
                subheadline: fields.text({ label: 'Subheadline', multiline: true }),
                subBodyText: fields.text({ label: 'Sub-body Text', multiline: true }),
                backgroundImage: fields.text({
                  label: 'Background Image',
                  description: 'Path to public asset, e.g. /assets/yoga_studio.jpg',
                }),
                logoOverlay: fields.text({
                  label: 'Logo Overlay (Centered)',
                  description: 'Path to public asset, e.g. /assets/eos-logo.png',
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
                backgroundImage: fields.text({
                  label: 'Background Image',
                  description: 'Path to public asset, e.g. /assets/...',
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
                    description: fields.text({ label: 'Description', multiline: true }),
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
                image: fields.text({
                  label: 'Background Image',
                  description: 'Path to public asset, e.g. /assets/...',
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
                    description: fields.text({ label: 'Description', multiline: true }),
                    image: fields.text({
                      label: 'Hover Image',
                      description: 'Path to public asset, e.g. /assets/...',
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
                    question: fields.text({ label: 'Question', multiline: true }),
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
