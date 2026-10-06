import { cloudflare } from '@cloudflare/vite-plugin';
import { fonts } from '@pyyupsk/vite-fonts';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    fonts({
      families: {
        display: {
          family: 'Anuphan',
          weights: [500, 600, 700],
          subsets: ['thai', 'latin'],
          variable: '--font-display',
        },
        sans: {
          family: 'IBM Plex Sans Thai Looped',
          weights: [400, 500, 600],
          subsets: ['thai', 'latin'],
          variable: '--font-sans',
          preload: true,
        },
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
