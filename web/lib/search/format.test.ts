import { describe, expect, it } from 'vitest'

import { pluralizeRu, pluralizeDoctors } from './format'

describe('pluralizeRu', () => {
  const forms: [string, string, string] = ['врач', 'врача', 'врачей']

  it('склоняет единицу', () => {
    expect(pluralizeRu(1, forms)).toBe('врач')
    expect(pluralizeRu(21, forms)).toBe('врач')
    expect(pluralizeRu(101, forms)).toBe('врач')
  })

  it('склоняет от двух до четырёх', () => {
    expect(pluralizeRu(2, forms)).toBe('врача')
    expect(pluralizeRu(4, forms)).toBe('врача')
    expect(pluralizeRu(22, forms)).toBe('врача')
  })

  it('склоняет пять и больше', () => {
    expect(pluralizeRu(5, forms)).toBe('врачей')
    expect(pluralizeRu(10, forms)).toBe('врачей')
    expect(pluralizeRu(100, forms)).toBe('врачей')
  })

  it('не сбивается на числах второго десятка', () => {
    // Классическая ловушка: 11 и 111 требуют форму «врачей», а не «врач».
    expect(pluralizeRu(11, forms)).toBe('врачей')
    expect(pluralizeRu(12, forms)).toBe('врачей')
    expect(pluralizeRu(14, forms)).toBe('врачей')
    expect(pluralizeRu(111, forms)).toBe('врачей')
  })

  it('склоняет ноль', () => {
    expect(pluralizeRu(0, forms)).toBe('врачей')
  })
})

describe('pluralizeDoctors', () => {
  it('даёт готовую форму слова «врач»', () => {
    expect(pluralizeDoctors(1)).toBe('врач')
    expect(pluralizeDoctors(3)).toBe('врача')
    expect(pluralizeDoctors(7)).toBe('врачей')
    expect(pluralizeDoctors(0)).toBe('врачей')
  })
})
