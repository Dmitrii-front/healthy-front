import { describe, expect, it } from 'vitest'

import type { DoctorProfileView } from './doctor-view'
import {
  buildLanguageOptions,
  buildSpecialtyOptions,
  SEARCH_INDEX_MAX_WORKPLACES,
  toSearchIndexItem,
} from './search-index'

function profile(overrides: Partial<DoctorProfileView> = {}): DoctorProfileView {
  return {
    id: '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
    shortName: 'Надточий Дмитрий',
    fullName: 'Надточий Дмитрий Сергеевич',
    initials: 'НД',
    avatarColor: '#E8D5C4',
    avatarUrl: null,
    specialization: 'Стоматолог',
    city: 'Бишкек',
    priceFrom: 1000,
    languages: ['Русский', 'Кыргызча'],
    languageCodes: ['ru', 'ky'],
    bio: 'Ведёт приём взрослых и детей.',
    education: 'КГМА, лечебное дело',
    scheduleNote: 'Приём по записи',
    subspecializations: ['Имплантолог'],
    yearsExperience: 12,
    rating: 4.8,
    reviewsCount: 37,
    consultationFormats: ['offline'],
    workplaces: [
      {
        id: 'w1',
        name: 'Клиника Смайл',
        address: 'ул. Киевская, 95',
        description: null,
        coordinates: null,
        mapImageUrl: null,
      },
    ],
    appointmentTypes: [{ id: 'a1', name: 'Первичный приём', durationMin: 30, workPlaceId: 'w1' }],
    ...overrides,
  }
}

describe('toSearchIndexItem', () => {
  it('кладёт подпись специальности в specialty, а ключ — в нижнем регистре', () => {
    const item = toSearchIndexItem(profile({ specialization: 'Стоматолог' }), 'nadtochiy')

    expect(item.specialty).toBe('Стоматолог')
    expect(item.specialtyKey).toBe('стоматолог')
  })

  it('не тащит в индекс поля, нужные только странице врача', () => {
    const item = toSearchIndexItem(profile(), 'nadtochiy')

    expect(item).not.toHaveProperty('bio')
    expect(item).not.toHaveProperty('education')
    expect(item).not.toHaveProperty('appointmentTypes')
    expect(item).not.toHaveProperty('rating')
    expect(item).not.toHaveProperty('reviewsCount')
    expect(item).not.toHaveProperty('id')
  })

  it('обрезает места приёма до предела, но помнит полное число', () => {
    const workplace = (id: string) => ({
      id,
      name: `Клиника ${id}`,
      address: `ул. ${id}`,
      description: 'описание',
      coordinates: { lat: 42.87, lng: 74.59 },
      mapImageUrl: 'https://example.com/map.png',
    })
    const item = toSearchIndexItem(
      profile({ workplaces: [workplace('a'), workplace('b'), workplace('c')] }),
      'nadtochiy',
    )

    expect(SEARCH_INDEX_MAX_WORKPLACES).toBe(2)
    expect(item.workplacesTotal).toBe(3)
    expect(item.workplaces).toEqual([
      { name: 'Клиника a', address: 'ул. a' },
      { name: 'Клиника b', address: 'ул. b' },
    ])
  })

  it('переживает врача без мест приёма', () => {
    const item = toSearchIndexItem(profile({ workplaces: [] }), 'nadtochiy')

    expect(item.workplaces).toEqual([])
    expect(item.workplacesTotal).toBe(0)
  })

  it('переносит стаж и цену числами, а не готовыми подписями', () => {
    const item = toSearchIndexItem(profile({ yearsExperience: 12, priceFrom: 1000 }), 'nadtochiy')

    expect(item.yearsExperience).toBe(12)
    expect(item.priceFrom).toBe(1000)
  })

  it('переживает неизвестный стаж и отсутствующую цену', () => {
    const item = toSearchIndexItem(profile({ yearsExperience: null, priceFrom: null }), 'nadtochiy')

    expect(item.yearsExperience).toBeNull()
    expect(item.priceFrom).toBeNull()
  })

  it('кладёт в slug то, что передали вторым аргументом', () => {
    const item = toSearchIndexItem(profile(), 'nadtochiy-dmitriy')

    expect(item.slug).toBe('nadtochiy-dmitriy')
  })
})

describe('buildSpecialtyOptions', () => {
  it('считает врачей по ключу специальности', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'Стоматолог' }),
      profile({ specialization: 'Хирург' }),
    ])

    expect(options).toEqual([
      { key: 'стоматолог', label: 'Стоматолог', count: 2 },
      { key: 'хирург', label: 'Хирург', count: 1 },
    ])
  })

  it('при равном числе врачей сортирует подписи по-русски', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: 'Ёлочный врач' }),
      profile({ specialization: 'Единорог' }),
      profile({ specialization: 'Аллерголог' }),
    ])

    expect(options.map((option) => option.label)).toEqual([
      'Аллерголог',
      'Единорог',
      'Ёлочный врач',
    ])
  })

  it('пропускает врача без специальности', () => {
    const options = buildSpecialtyOptions([
      profile({ specialization: '' }),
      profile({ specialization: 'Хирург' }),
    ])

    expect(options).toEqual([{ key: 'хирург', label: 'Хирург', count: 1 }])
  })
})

describe('buildLanguageOptions', () => {
  it('считает врачей по каждому коду и подписывает через словарь языков', () => {
    const options = buildLanguageOptions([
      profile({ languageCodes: ['ru', 'ky'] }),
      profile({ languageCodes: ['ru'] }),
    ])

    expect(options).toEqual([
      { key: 'ru', label: 'Русский', count: 2 },
      { key: 'ky', label: 'Кыргызча', count: 1 },
    ])
  })

  it('не теряет незнакомый код', () => {
    const options = buildLanguageOptions([profile({ languageCodes: ['de'] })])

    expect(options).toEqual([{ key: 'de', label: 'DE', count: 1 }])
  })

  it('отдаёт пустой список для каталога без языков', () => {
    const options = buildLanguageOptions([profile({ languageCodes: [] })])

    expect(options).toEqual([])
  })

  it('при равном числе врачей сортирует подписи по-русски', () => {
    const options = buildLanguageOptions([
      profile({ languageCodes: ['en'] }),
      profile({ languageCodes: ['ky'] }),
      profile({ languageCodes: ['ru'] }),
    ])

    expect(options.map((option) => option.label)).toEqual(['Кыргызча', 'Русский', 'English'])
  })
})
