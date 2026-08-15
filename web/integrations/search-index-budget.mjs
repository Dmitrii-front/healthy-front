import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { brotliCompressSync } from 'node:zlib'

import { probeDistRoot } from './dist-root.mjs'

const ISLAND = /<script[^>]*id="search-data"[^>]*>([\s\S]*?)<\/script>/
const WARN_KB = 20
const FAIL_KB = 30

const kb = (bytes) => (bytes / 1024).toFixed(1)

const readSearchPage = (dir) =>
  probeDistRoot(dir, (root) =>
    readFile(join(root, 'search', 'index.html'), 'utf8').catch(() => null),
  )

// The trade stops paying somewhere around three hundred doctors.
export default function searchIndexBudget() {
  return {
    name: 'hm-search-index-budget',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const html = await readSearchPage(dir)
        if (html === null) {
          // Пропавшая страница скрывает строго больше, чем пропавший островок
          // ниже, поэтому и здесь молчать нельзя: проверка веса просто
          // отключилась бы на той сборке, где сломана сама выдача.
          throw new Error(
            'No search/index.html in the build output: the search page is gone, or the CF adapter ' +
              'moved the static root and this budget check no longer measures anything.',
          )
        }

        const island = ISLAND.exec(html)
        if (!island) {
          // Молчать здесь нельзя: страница на месте, а островка нет — значит
          // сломалась либо выдача, либо сам сторож, и оба случая тихо
          // превращают проверку веса в зелёную сборку.
          throw new Error(
            'No #search-data island in search/index.html: the search page ships no catalogue, ' +
              'or the island id changed and this budget check no longer measures anything.',
          )
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
