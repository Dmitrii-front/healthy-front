import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'

const ISLAND = /<script[^>]*id="search-data"[^>]*>([\s\S]*?)<\/script>/
const WARN_KB = 20
const FAIL_KB = 30

const kb = (bytes) => (bytes / 1024).toFixed(1)

// The doctor catalogue ships inline in /search: one round-trip beats a separate
// file on 3G. The trade stops paying somewhere around 300 doctors — past that
// the index has to move out and pagination has to come back. Sizes drift by a
// kilobyte per release, so the threshold is checked here, not by eye.
export default function searchIndexBudget() {
  return {
    name: 'hm-search-index-budget',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const page = join(fileURLToPath(dir), 'search', 'index.html')

        let html
        try {
          html = await readFile(page, 'utf8')
        } catch {
          logger.warn('No search/index.html in the output — skipping the search index budget.')
          return
        }

        const island = ISLAND.exec(html)
        if (!island) {
          logger.warn(
            'No #search-data island in search/index.html — skipping the search index budget.',
          )
          return
        }

        const payload = Buffer.from(island[1], 'utf8')
        const compressed = brotliCompressSync(payload).length
        const measured = `search index: ${kb(payload.length)} KB raw, ${kb(compressed)} KB brotli`

        if (compressed > FAIL_KB * 1024) {
          throw new Error(
            `Inline ${measured} — over the ${FAIL_KB} KB brotli budget. ` +
              'Move the index out into a separate file and bring pagination back.',
          )
        }

        if (compressed > WARN_KB * 1024) {
          logger.warn(
            `Inline ${measured} — past the ${WARN_KB} KB mark, ${FAIL_KB} KB fails the build.`,
          )
          return
        }

        logger.info(`Inline ${measured}, budget ${FAIL_KB} KB.`)
      },
    },
  }
}
