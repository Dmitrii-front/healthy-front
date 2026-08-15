import { describe, expect, it } from 'vitest'

import type { DoctorProfileDto, DoctorSearchItemDto } from './doctor-api.schema'
import { toDoctorListItem, toDoctorProfileView } from './doctor-view'

function makeSearchItem(overrides: Partial<DoctorSearchItemDto> = {}): DoctorSearchItemDto {
  return {
    id: '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
    first_name: 'Дмитрий',
    last_name: 'Надточий',
    middle_name: 'Сергеевич',
    avatar_url: null,
    specialization: 'стоматолог',
    primary_work_city: 'Бишкек',
    price_from: 1000,
    languages: ['ru', 'ky'],
    ...overrides,
  }
}

function makeProfile(overrides: Partial<DoctorProfileDto> = {}): DoctorProfileDto {
  return {
    ...makeSearchItem(),
    bio: null,
    start_practise_date: null,
    education: null,
    schedule_note: null,
    subspecializations: null,
    consultation_formats: null,
    rating: null,
    reviews_count: 0,
    workplaces: [],
    appointment_types: [],
    ...overrides,
  }
}

describe('toDoctorListItem', () => {
  it('оставляет в languages подписи, а коды кладёт в languageCodes', () => {
    const item = toDoctorListItem(makeSearchItem({ languages: ['ru', 'ky'] }))

    expect(item.languages).toEqual(['Русский', 'Кыргызча'])
    expect(item.languageCodes).toEqual(['ru', 'ky'])
  })

  it('приводит коды языков к нижнему регистру', () => {
    const item = toDoctorListItem(makeSearchItem({ languages: ['RU', 'Ky'] }))

    expect(item.languageCodes).toEqual(['ru', 'ky'])
  })

  it('отдаёт пустые списки, когда языков нет', () => {
    const item = toDoctorListItem(makeSearchItem({ languages: null }))

    expect(item.languages).toEqual([])
    expect(item.languageCodes).toEqual([])
  })

  it('поднимает регистр специализации', () => {
    const item = toDoctorListItem(makeSearchItem({ specialization: 'стоматолог' }))

    expect(item.specialization).toBe('Стоматолог')
  })
})

describe('toDoctorProfileView', () => {
  it('несёт коды языков наравне с карточкой выдачи', () => {
    const view = toDoctorProfileView(makeProfile({ languages: ['ru', 'en'] }))

    expect(view.languages).toEqual(['Русский', 'English'])
    expect(view.languageCodes).toEqual(['ru', 'en'])
  })
})
