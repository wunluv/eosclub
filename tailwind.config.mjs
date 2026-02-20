/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        eos: {
          'base':     '#F9F9F7',
          'contrast': '#2F3A40',
          'accent':   '#FF2E00',
          'subtle':   '#E6E5E0',
          'text':     '#1F2933',
          'zen':      '#09090B',
        }
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #FF2E00 0%, #FF5C00 100%)',
        'heat-gradient':   'linear-gradient(135deg, #E9B24A 0%, #E8742C 35%, #E6534A 60%, #E24676 78%, #C74A8E 100%)',
        'wash-gradient':   'linear-gradient(135deg, #F2F4C9 0%, #FBF3D6 45%, #F8E1D5 100%)',
      },
      fontFamily: {
        'serif': ['Merriweather', 'serif'],
        'sans':  ['Geist Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
