import { describe, expect, it } from 'vitest'

import { yearsSince } from './doctor-display'

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
