// tina/config.ts
import { defineConfig } from "tinacms";
var config_default = defineConfig({
  branch: process.env.TINA_BRANCH || process.env.HEAD || "main",
  clientId: process.env.TINA_PUBLIC_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "assets",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "pages",
        label: "Pages",
        path: "src/content/pages",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Page Title", required: true },
          { type: "string", name: "seoDescription", label: "SEO Description", required: true },
          { type: "image", name: "ogImage", label: "OG Image" },
          { type: "string", name: "translationSlug", label: "Translation Slug", required: true },
          {
            type: "object",
            name: "blocks",
            label: "Content Blocks",
            list: true,
            templates: [
              {
                name: "HeroBlock",
                label: "Hero Block",
                fields: [
                  { type: "string", name: "headline", label: "Headline", required: true },
                  { type: "string", name: "subheadline", label: "Subheadline" },
                  { type: "image", name: "backgroundImage", label: "Background Image", required: true },
                  { type: "string", name: "ctaLabel", label: "CTA Label" },
                  { type: "string", name: "ctaUrl", label: "CTA URL" }
                ]
              },
              {
                name: "ContentBlock",
                label: "Content Block",
                fields: [
                  { type: "rich-text", name: "body", label: "Body Content", required: true }
                ]
              },
              {
                name: "BookingBlock",
                label: "Booking Block",
                fields: [
                  { type: "boolean", name: "enabled", label: "Enabled", required: true },
                  { type: "string", name: "bookingUrl", label: "bsport Booking URL", required: true },
                  { type: "string", name: "label", label: "Section Label" }
                ]
              },
              {
                name: "FeatureGridBlock",
                label: "Feature Grid Block",
                fields: [
                  {
                    type: "object",
                    name: "items",
                    label: "Features",
                    list: true,
                    fields: [
                      { type: "string", name: "icon", label: "Feather Icon Name", required: true },
                      { type: "string", name: "title", label: "Title", required: true },
                      { type: "string", name: "description", label: "Description", required: true }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
