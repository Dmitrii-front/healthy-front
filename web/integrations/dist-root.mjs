import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The Astro CF adapter places static output (HTML + _astro chunks) under
 * either dist/ or dist/client/ depending on the version. Every build
 * integration that reads the output has to probe both, so the layout is known
 * here and nowhere else — one file to fix when the adapter moves things again.
 *
 * `read` is called with each candidate root in parallel and returns whatever
 * the caller needs from that root (the root itself, the file it just read),
 * or null when this candidate is not the one. It must not reject: swallow the
 * miss with .catch(() => null).
 */
export async function probeDistRoot(dir, read) {
  const fsPath = fileURLToPath(dir)
  const candidates = [join(fsPath, 'client'), fsPath]
  const probes = await Promise.all(candidates.map((root) => read(root)))
  return probes.find((value) => value !== null) ?? null
}
