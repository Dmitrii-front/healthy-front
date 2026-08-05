import { describe, expect, it } from 'vitest'

import { formatExperienceLabel, yearsSince } from './doctor-display'

describe('yearsSince', () => {
  it('считает полные годы от переданной даты', () => {
    expect(yearsSince('1990-12-02', new Date('2026-08-05'))).toBe(35)
  })

  it('не засчитывает неполный год', () => {
    // Ровно день до годовщины — стажа ещё нет.
    expect(yearsSince('2025-08-06', new Date('2026-08-05'))).toBe(0)
    // Годовщина наступила.
    expect(yearsSince('2025-08-05', new Date('2026-08-05'))).toBe(1)
  })

  it('отдаёт ноль для начавших практику в этом году', () => {
    // В проде такие есть: врач с датой начала практики трёхдневной давности.
    expect(yearsSince('2026-08-02', new Date('2026-08-05'))).toBe(0)
  })

  it('отдаёт null для отсутствующей и битой даты', () => {
    expect(yearsSince(null, new Date('2026-08-05'))).toBeNull()
    expect(yearsSince('не дата', new Date('2026-08-05'))).toBeNull()
  })

  it('отдаёт null, если практика начинается в будущем', () => {
    expect(yearsSince('2027-01-01', new Date('2026-08-05'))).toBeNull()
  })
})

describe('formatExperienceLabel', () => {
  it('показывает нулевой стаж словами, а не «0 лет»', () => {
    expect(formatExperienceLabel(0)).toBe('Менее года')
  })

  it('склоняет годы по-русски', () => {
    expect(formatExperienceLabel(1)).toBe('1 год')
    expect(formatExperienceLabel(2)).toBe('2 года')
    expect(formatExperienceLabel(4)).toBe('4 года')
    expect(formatExperienceLabel(5)).toBe('5 лет')
    expect(formatExperienceLabel(20)).toBe('20 лет')
    expect(formatExperienceLabel(21)).toBe('21 год')
    expect(formatExperienceLabel(22)).toBe('22 года')
    expect(formatExperienceLabel(25)).toBe('25 лет')
    expect(formatExperienceLabel(32)).toBe('32 года')
  })

  it('не сбивается на числах второго десятка', () => {
    // 11-14 — исключение из правила: «одиннадцать лет», а не «одиннадцать год».
    expect(formatExperienceLabel(11)).toBe('11 лет')
    expect(formatExperienceLabel(12)).toBe('12 лет')
    expect(formatExperienceLabel(14)).toBe('14 лет')
    expect(formatExperienceLabel(111)).toBe('111 лет')
  })

  it('отдаёт null, когда стаж неизвестен — строку рисовать нечем', () => {
    expect(formatExperienceLabel(null)).toBeNull()
  })
})
