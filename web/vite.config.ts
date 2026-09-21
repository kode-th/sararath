import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { fonts } from '@pyyupsk/vite-fonts'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    fonts({
      families: {
        sans: {
          family: 'Noto Sans Thai',
          weights: [300, 400, 500, 600, 700],
          subsets: ['thai', 'latin'],
          variable: '--font-sans',
          preload: true,
        },
        serif: {
          family: 'Noto Serif Thai',
          weights: [600, 700, 800],
          subsets: ['thai', 'latin'],
          variable: '--font-serif',
        },
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
