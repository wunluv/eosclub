import { defineConfig } from 'tinacms';

const CustomAuthProvider = () => {
  if (typeof window === 'undefined') {
    return {
      authenticate: async () => null,
      getToken: async () => ({ id_token: null }),
      getUser: async () => null,
      logout: async () => {},
      authorize: async () => null,
      isAuthorized: async () => false,
      isAuthenticated: async () => false,
      fetchWithToken: async (input: any, init: any) => fetch(input, init),
      getLoginStrategy: () => "Redirect",
      getLoginScreen: () => null,
      getSessionProvider: () => (props: any) => props.children,
    };
  }

  return {
    authenticate: async () => {
      const token = localStorage.getItem('tina_jwt');
      if (token) return { id_token: token };

      const password = window.prompt('Please enter the admin password');
      if (!password) return null;

      try {
        const response = await fetch('/api/tina/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (response.ok) {
          const { token } = await response.json();
          localStorage.setItem('tina_jwt', token);
          return { id_token: token };
        } else {
          const errorData = await response.json();
          alert(`Login failed: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: Could not connect to the authentication server.');
      }
      return null;
    },
    getToken: async () => {
      const token = localStorage.getItem('tina_jwt');
      return { id_token: token };
    },
    getUser: async () => {
      return !!localStorage.getItem('tina_jwt');
    },
    logout: async () => {
      localStorage.removeItem('tina_jwt');
    },
    authorize: async (context: any) => {
      const token = localStorage.getItem('tina_jwt');
      if (token) return { id_token: token };
      return null;
    },
    isAuthorized: async (context: any) => {
      return !!localStorage.getItem('tina_jwt');
    },
    isAuthenticated: async () => {
      return !!localStorage.getItem('tina_jwt');
    },
    fetchWithToken: async (input: any, init: any) => {
      const headers = (init == null ? void 0 : init.headers) || {};
      const token = localStorage.getItem('tina_jwt');
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
      return await fetch(input, {
        ...init || {},
        headers: new Headers(headers)
      });
    },
    getLoginStrategy: () => "Redirect",
    getLoginScreen: () => null,
    getSessionProvider: () => (props: any) => props.children,
  };
};

export default defineConfig({
  contentApiUrlOverride: '/api/tina/graphql',
  branch: process.env.TINA_BRANCH || process.env.HEAD || 'main',
  clientId: '00000000-0000-0000-0000-000000000000',
  token: '0000000000000000000000000000000000000000',
  authProvider: CustomAuthProvider() as any,
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
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
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
                  { type: 'string', name: 'subBodyText', label: 'Sub-body Text' },
                  { type: 'image', name: 'backgroundImage', label: 'Background Image' },
                  { type: 'image', name: 'logoOverlay', label: 'Logo Overlay (Centered)' },
                  { type: 'string', name: 'ctaLabel', label: 'CTA Label' },
                  { type: 'string', name: 'ctaUrl', label: 'CTA URL' },
                ],
              },
              {
                name: 'ContentBlock',
                label: 'Content Block',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
                  { type: 'rich-text', name: 'body', label: 'Body Content', required: true },
                  { type: 'boolean', name: 'fullBleed', label: 'Full Bleed Layout' },
                  { type: 'image', name: 'backgroundImage', label: 'Background Image' },
                ],
              },
              {
                name: 'BookingBlock',
                label: 'Booking Block',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
                  { type: 'boolean', name: 'enabled', label: 'Enabled', required: true },
                  { type: 'string', name: 'bookingUrl', label: 'bsport Booking URL', required: true },
                  { type: 'string', name: 'label', label: 'Section Label' },
                ],
              },
              {
                name: 'FeatureGridBlock',
                label: 'Feature Grid Block',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
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
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
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
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
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
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
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
              {
                name: 'BsportCalendar',
                label: 'bsport: Calendar',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
                  { type: 'string', name: 'elementId', label: 'Unique Element ID', required: true },
                ],
              },
              {
                name: 'BsportPasses',
                label: 'bsport: Passes',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
                  { type: 'string', name: 'elementId', label: 'Unique Element ID', required: true },
                ],
              },
              {
                name: 'BsportSubscription',
                label: 'bsport: Subscriptions',
                fields: [
                  { type: 'string', name: 'name', label: 'Section Name (internal reference)' },
                  { type: 'string', name: 'elementId', label: 'Unique Element ID', required: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
