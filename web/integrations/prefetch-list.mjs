import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLACEHOLDER = '"__HM_PREFETCH_LIST__"'

// Astro CF adapter places static output (HTML + _astro chunks) under
// either dist/ or dist/client/ depending on the version. Probe both.
async function findClientRoot(dir) {
  const fsPath = fileURLToPath(dir)
  for (const candidate of [join(fsPath, 'client'), fsPath]) {
    try {
      await readdir(join(candidate, '_astro'))
      return candidate
    } catch {}
  }
  return null
}

async function walkHtml(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walkHtml(p)))
    else if (entry.name.endsWith('.html')) out.push(p)
  }
  return out
}

// Astro integration: after the build is done, scan the built _astro/
// directory and inject the full list of chunk URLs as a JSON literal
// into every SEO HTML file. The runtime warm-up script in BaseLayout
// then fires fetch() at each URL in parallel — no DOM parsing, no
// multi-pass walker, no recursion.
export default function prefetchList() {
  return {
    name: 'hm-prefetch-list',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const clientRoot = await findClientRoot(dir)
        if (!clientRoot) {
          logger.warn('Could not locate _astro/ output; skipping prefetch list injection.')
          return
        }
        const astroDir = join(clientRoot, '_astro')
        const entries = await readdir(astroDir)
        const chunks = entries
          .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
          .map((f) => `/_astro/${f}`)
          .sort()
        // Prefix with /app/ so the SPA shell HTML itself is warmed too.
        const urls = ['/app/', ...chunks]
        const json = JSON.stringify(urls)
        const htmls = await walkHtml(clientRoot)
        let touched = 0
        for (const html of htmls) {
          const content = await readFile(html, 'utf8')
          if (content.includes(PLACEHOLDER)) {
            await writeFile(html, content.replace(PLACEHOLDER, json))
            touched += 1
          }
        }
        logger.info(
          `Injected prefetch list (${urls.length} URLs, ${json.length} B) into ${touched} HTML file${touched === 1 ? '' : 's'}.`,
        )
      },
    },
  }
}
