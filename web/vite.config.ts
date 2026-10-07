import { cloudflare } from '@cloudflare/vite-plugin';
import { fonts } from '@pyyupsk/vite-fonts';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteEnv from '@vite-env/core/plugin';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    viteEnv({ configFile: './env.ts' }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    fonts({
      families: {
        display: {
          family: 'Anuphan',
          weights: [600, 700],
          subsets: ['thai', 'latin'],
          variable: '--font-display',
          preload: [600, 700],
          adjustFontFallback: true,
        },
        sans: {
          family: 'IBM Plex Sans Thai Looped',
          weights: [400, 500, 600],
          subsets: ['thai', 'latin'],
          variable: '--font-sans',
          preload: [400, 600],
          adjustFontFallback: true,
        },
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
