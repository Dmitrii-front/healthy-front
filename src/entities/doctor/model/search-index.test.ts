import { describe, expect, it } from 'vitest'

import type { DoctorProfileView } from './doctor-view'
import {
  buildLanguageOptions,
  buildSpecialtyOptions,
  fromSearchIndexWire,
  toSearchIndexItem,
  toSearchIndexWire,
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

  it('берёт из мест приёма только первое название, но помнит полное число', () => {
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

    expect(item.workplaceName).toBe('Клиника a')
    expect(item.workplacesTotal).toBe(3)
  })

  it('переживает врача без мест приёма', () => {
    const item = toSearchIndexItem(profile({ workplaces: [] }), 'nadtochiy')

    expect(item.workplaceName).toBeNull()
    expect(item.workplacesTotal).toBe(0)
  })

  it('переносит каждое поле из своего источника', () => {
    // Половина полей проекции — строки, и типы не поймают перепутанные местами
    // fullName с initials или languages с languageCodes. Ловит только сверка
    // целиком на значениях, различимых между собой.
    const item = toSearchIndexItem(
      profile({
        fullName: 'Петровский Сергей',
        initials: 'ПС',
        avatarColor: '#ABCDEF',
        specialization: 'Хирург',
        subspecializations: ['Ортопед', 'Травматолог'],
        city: 'Ананьево',
        languages: ['Русский', 'English'],
        languageCodes: ['ru', 'en'],
        priceFrom: 2999,
        yearsExperience: 23,
      }),
      'petrovskiy-sergey',
    )

    expect(item).toEqual({
      slug: 'petrovskiy-sergey',
      fullName: 'Петровский Сергей',
      initials: 'ПС',
      avatarColor: '#ABCDEF',
      specialty: 'Хирург',
      specialtyKey: 'хирург',
      subspecializations: ['Ортопед', 'Травматолог'],
      city: 'Ананьево',
      languages: ['Русский', 'English'],
      languageCodes: ['ru', 'en'],
      priceFrom: 2999,
      yearsExperience: 23,
      workplaceName: 'Клиника Смайл',
      workplacesTotal: 1,
    })
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

describe('toSearchIndexWire / fromSearchIndexWire', () => {
  it('не везёт в HTML подписи, которые страница уже отправляет словарями', () => {
    const wire = toSearchIndexWire(toSearchIndexItem(profile(), 'nadtochiy'))

    expect(wire).not.toHaveProperty('specialty')
    expect(wire).not.toHaveProperty('languages')
    expect(wire.specialtyKey).toBe('стоматолог')
    expect(wire.languageCodes).toEqual(['ru', 'ky'])
  })

  it('собирает запись обратно словарями той же страницы без потерь', () => {
    // Словари строятся ровно так же, как в frontmatter выдачи: если сборка
    // подписей и их разбор разойдутся, карточка поедет с чужим словом.
    //
    // Языки во враче держатся парой: подписи выводятся из тех же кодов
    // (toDoctorListItem), и именно на этом стоит обратная сборка.
    const catalog = [
      profile(),
      profile({ specialization: 'Хирург', languages: ['English'], languageCodes: ['en'] }),
    ]
    const specialtyLabels = Object.fromEntries(
      buildSpecialtyOptions(catalog).map((option) => [option.key, option.label]),
    )
    const languageLabels = Object.fromEntries(
      buildLanguageOptions(catalog).map((option) => [option.key, option.label]),
    )

    for (const doctor of catalog) {
      const item = toSearchIndexItem(doctor, 'slug')

      expect(fromSearchIndexWire(toSearchIndexWire(item), specialtyLabels, languageLabels)).toEqual(
        item,
      )
    }
  })

  it('показывает ключ как есть, когда подписи для него не приехало', () => {
    const item = toSearchIndexItem(profile({ languageCodes: ['de'] }), 'nadtochiy')
    const restored = fromSearchIndexWire(toSearchIndexWire(item), {}, {})

    expect(restored.specialty).toBe('стоматолог')
    expect(restored.languages).toEqual(['de'])
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

  it('считает врача один раз, даже если код повторился в его списке', () => {
    const options = buildLanguageOptions([profile({ languageCodes: ['ru', 'ru'] })])

    expect(options).toEqual([{ key: 'ru', label: 'Русский', count: 1 }])
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
