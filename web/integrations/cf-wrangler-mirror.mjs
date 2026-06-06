import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// @astrojs/cloudflare v13 emits the deploy config at dist/client/wrangler.json
// for static builds, but Cloudflare Workers Builds' default deploy command
// looks for dist/server/wrangler.json (the legacy server-build path). Mirror
// the file with the assets.directory rewritten to point back at ../client.
export default function cfWranglerMirror() {
  return {
    name: 'hm-cf-wrangler-mirror',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const distRoot = dirname(fileURLToPath(dir))
        const src = join(distRoot, 'client', 'wrangler.json')

        let raw
        try {
          raw = await readFile(src, 'utf8')
        } catch {
          logger.info('No dist/client/wrangler.json — skipping mirror.')
          return
        }

        const config = JSON.parse(raw)
        if (config.assets) config.assets.directory = '../client'

        const serverDir = join(distRoot, 'server')
        await mkdir(serverDir, { recursive: true })
        await writeFile(join(serverDir, 'wrangler.json'), JSON.stringify(config))
        logger.info('Mirrored wrangler.json to dist/server/ (assets → ../client).')
      },
    },
  }
}
