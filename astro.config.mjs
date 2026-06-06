import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
// @ts-check
import { defineConfig } from 'astro/config'

import cfWranglerMirror from './web/integrations/cf-wrangler-mirror.mjs'
import prefetchList from './web/integrations/prefetch-list.mjs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  site: 'https://sdoctorom.health',
  srcDir: './web',
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [
    react({
      babel: { plugins: [['babel-plugin-react-compiler', {}]] },
    }),
    sitemap({ filter: (page) => !page.includes('/app/') }),
    prefetchList(),
    cfWranglerMirror(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
  },
  prefetch: { defaultStrategy: 'viewport' },
  // Auth (sign-in, sign-up, forgot-password, verify-email, reset-password)
  // is served by Astro pages in the SEO zone — no redirects into the SPA.
})
