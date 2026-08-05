/**
 * Останавливает сборку с объяснением, которое человек действительно увидит.
 *
 * Frontmatter и getStaticPaths исполняются внутри воркера miniflare (адаптер
 * Cloudflare), и брошенное оттуда исключение доезжает до терминала обёрнутым:
 * «Failed to get static paths from the Cloudflare prerender server (500)» и
 * «Network connection lost» — текст сообщения теряется целиком. Обычный вывод
 * в консоль из воркера при этом доходит, поэтому сообщение сначала печатается,
 * а потом бросается.
 *
 * Печать — не дубль ради дубля: без неё все подробные сообщения этого слоя
 * существуют только в исходниках и не помогают тому, кто разбирает упавший CI.
 */
export function failBuild(message: string): never {
  console.error(`[doctors] ${message}`)
  throw new Error(message)
}
