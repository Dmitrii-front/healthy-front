// Cyrillic → Latin transliteration for SEO-friendly slugs.
// Build-time only — used in getStaticPaths for /doctor/[id] and /specialty/[slug].

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function doctorSlug(doctor: { id: string; name: string }): string {
  const base = slugify(doctor.name)
  return base ? `${base}-${doctor.id}` : doctor.id
}
