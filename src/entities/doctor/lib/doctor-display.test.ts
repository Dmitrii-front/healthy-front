import { describe, expect, it } from 'vitest'

import {
  avatarColorFor,
  buildFullName,
  buildInitials,
  buildShortName,
  formatExperienceLabel,
  formatLanguages,
  formatPriceKgs,
  normalizeSpecialization,
  yearsSince,
} from './doctor-display'

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

describe('formatLanguages', () => {
  it('разворачивает ISO-коды в самоназвания', () => {
    expect(formatLanguages(['ru', 'ky', 'en'])).toEqual(['Русский', 'Кыргызча', 'English'])
  })

  it('не теряет незнакомый код, а поднимает его в верхний регистр', () => {
    expect(formatLanguages(['de'])).toEqual(['DE'])
  })

  it('не спотыкается о регистр входа', () => {
    expect(formatLanguages(['RU'])).toEqual(['Русский'])
  })

  it('отдаёт пустой список для пустого входа', () => {
    expect(formatLanguages([])).toEqual([])
  })
})

describe('formatPriceKgs', () => {
  it('форматирует цену с разрядами и сомом', () => {
    // Неразрывный пробел из Intl — сравниваем через регулярку, чтобы тест не
    // падал из-за невидимого символа.
    expect(formatPriceKgs(1000)).toMatch(/^1\s000 с$/u)
    expect(formatPriceKgs(2999)).toMatch(/^2\s999 с$/u)
  })

  it('отдаёт null, когда цены нет', () => {
    expect(formatPriceKgs(null)).toBeNull()
  })
})

describe('normalizeSpecialization', () => {
  it('поднимает первую букву: в базе встречается и «стоматолог», и «Стоматолог»', () => {
    expect(normalizeSpecialization('стоматолог')).toBe('Стоматолог')
    expect(normalizeSpecialization('Стоматолог')).toBe('Стоматолог')
  })

  it('не трогает остальные буквы, чтобы не сломать аббревиатуры', () => {
    expect(normalizeSpecialization('врач УЗИ')).toBe('Врач УЗИ')
  })

  it('обрезает пробелы и переживает пустую строку', () => {
    expect(normalizeSpecialization('  хирург  ')).toBe('Хирург')
    expect(normalizeSpecialization('')).toBe('')
    expect(normalizeSpecialization('   ')).toBe('')
  })
})

describe('buildInitials', () => {
  it('берёт первые буквы фамилии и имени', () => {
    expect(buildInitials('Надточий', 'Дмитрий')).toBe('НД')
  })

  it('переживает пустое имя', () => {
    expect(buildInitials('Иванов', '')).toBe('И')
  })

  it('отдаёт прочерк, когда имени нет вовсе — карточке нужен хоть какой-то знак', () => {
    expect(buildInitials('', '')).toBe('—')
  })
})

describe('buildShortName и buildFullName', () => {
  it('короткое имя — фамилия и имя', () => {
    expect(buildShortName('Петров', 'Пётр')).toBe('Петров Пётр')
  })

  it('полное имя добавляет отчество, когда оно есть', () => {
    expect(buildFullName('Петров', 'Пётр', 'Петрович')).toBe('Петров Пётр Петрович')
  })

  it('полное имя не оставляет висящий пробел без отчества', () => {
    expect(buildFullName('Петров', 'Пётр', null)).toBe('Петров Пётр')
  })
})

describe('avatarColorFor', () => {
  it('даёт один и тот же цвет одному и тому же врачу', () => {
    const id = '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0'
    expect(avatarColorFor(id)).toBe(avatarColorFor(id))
  })

  it('выдаёт цвет из палитры, а не произвольную строку', () => {
    const palette = ['#E8D5C4', '#D8E3DC', '#E5DCEA', '#DCE5EE', '#EFE3D0', '#DDE7E3']
    expect(palette).toContain(avatarColorFor('какой-угодно-id'))
  })

  it('переживает пустой id', () => {
    expect(typeof avatarColorFor('')).toBe('string')
  })
})
