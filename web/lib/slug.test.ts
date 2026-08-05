import { describe, expect, it } from 'vitest'

import { doctorSlug, slugify } from './slug'

describe('slugify', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Надточий Дмитрий')).toBe('nadtochiy-dmitriy')
  })

  it('передаёт щ, ё, ю, я многобуквенными сочетаниями', () => {
    expect(slugify('Щёткин')).toBe('schyotkin')
    expect(slugify('Юлия Яковлева')).toBe('yuliya-yakovleva')
  })

  it('выбрасывает мягкий и твёрдый знак', () => {
    expect(slugify('Ильясов')).toBe('ilyasov')
    expect(slugify('Объедков')).toBe('obedkov')
  })

  it('схлопывает разделители и не оставляет их по краям', () => {
    expect(slugify('  Пётр   Петров-Водкин  ')).toBe('pyotr-petrov-vodkin')
  })

  it('отдаёт пустую строку, когда транслитерировать нечего', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })
})

describe('doctorSlug', () => {
  const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

  it('склеивает транслитерированное имя с идентификатором', () => {
    expect(doctorSlug({ id, name: 'Иванов Иван' })).toBe(`ivanov-ivan-${id}`)
  })

  it('падает обратно на голый идентификатор, если имя не транслитерируется', () => {
    // Иначе слаг начнётся с дефиса и путь получится битым.
    expect(doctorSlug({ id, name: '???' })).toBe(id)
  })

  it('оставляет идентификатор в конце — по нему страница врача находит запись', () => {
    expect(doctorSlug({ id, name: 'Петров Пётр' }).endsWith(id)).toBe(true)
  })
})
