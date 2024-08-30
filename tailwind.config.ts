import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  safelist: [
    { pattern: /gap-\d/ }, // Used by Stack
    { pattern: /pt-\d/ }, // Used by Inset
    { pattern: /pr-\d/ }, // Used by Inset
    { pattern: /pb-\d/ }, // Used by Inset
    { pattern: /pl-\d/ }, // Used by Inset
  ],
  plugins: [],
}
export default config
