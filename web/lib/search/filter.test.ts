import { describe, expect, it } from 'vitest'

import { filterDoctors } from './filter'
import type { SearchableDoctor } from './filter'
import { EMPTY_SEARCH_STATE } from './state'

function doctor(partial: Partial<SearchableDoctor> = {}): SearchableDoctor {
  return {
    fullName: 'Иванов Иван Иванович',
    specialty: 'Стоматолог',
    specialtyKey: 'стоматолог',
    subspecializations: [],
    languageCodes: ['ru'],
    ...partial,
  }
}

describe('filterDoctors', () => {
  it('без фильтров отдаёт весь список', () => {
    const items = [doctor(), doctor({ fullName: 'Петров Пётр Петрович' })]
    expect(filterDoctors(items, EMPTY_SEARCH_STATE)).toEqual(items)
  })

  it('ищет по фамилии независимо от регистра', () => {
    const ivanov = doctor()
    const petrov = doctor({ fullName: 'Петров Пётр Петрович' })
    expect(filterDoctors([ivanov, petrov], { ...EMPTY_SEARCH_STATE, q: 'ИВАНОВ' })).toEqual([
      ivanov,
    ])
  })

  it('ищет по специальности', () => {
    const dentist = doctor()
    const surgeon = doctor({ specialty: 'Хирург', specialtyKey: 'хирург' })
    expect(filterDoctors([dentist, surgeon], { ...EMPTY_SEARCH_STATE, q: 'хирург' })).toEqual([
      surgeon,
    ])
  })

  it('ищет по суб-специализации', () => {
    // Четырёх стоматологов различают именно ею: специальность у всех одна.
    const implantologist = doctor({ subspecializations: ['Имплантология'] })
    const orthodontist = doctor({ subspecializations: ['Ортодонтия'] })
    expect(
      filterDoctors([implantologist, orthodontist], {
        ...EMPTY_SEARCH_STATE,
        q: 'имплант',
      }),
    ).toEqual([implantologist])
  })

  it('не ищет по названию места приёма', () => {
    // Сознательное решение: поиск идёт по врачу, а не по клинике.
    const items = [doctor()]
    expect(filterDoctors(items, { ...EMPTY_SEARCH_STATE, q: 'Зубная фея' })).toEqual([])
  })

  it('фильтрует по ключу специальности, а не по подписи', () => {
    // В базе встречается и «стоматолог», и «Стоматолог» — ключ схлопывает оба.
    const lower = doctor({ specialty: 'стоматолог' })
    const upper = doctor({ specialty: 'Стоматолог' })
    const surgeon = doctor({ specialty: 'Хирург', specialtyKey: 'хирург' })
    expect(
      filterDoctors([lower, upper, surgeon], { ...EMPTY_SEARCH_STATE, specialty: 'стоматолог' }),
    ).toEqual([lower, upper])
  })

  it('фильтрует по коду языка', () => {
    const kyrgyz = doctor({ languageCodes: ['ru', 'ky'] })
    const russian = doctor({ languageCodes: ['ru'] })
    expect(filterDoctors([kyrgyz, russian], { ...EMPTY_SEARCH_STATE, lang: 'ky' })).toEqual([
      kyrgyz,
    ])
  })

  it('применяет все три фильтра разом', () => {
    const target = doctor({ languageCodes: ['ru', 'ky'] })
    const wrongLang = doctor({ languageCodes: ['ru'] })
    const wrongSpecialty = doctor({
      specialty: 'Хирург',
      specialtyKey: 'хирург',
      languageCodes: ['ru', 'ky'],
    })
    const wrongName = doctor({ fullName: 'Петров Пётр Петрович', languageCodes: ['ru', 'ky'] })
    expect(
      filterDoctors([target, wrongLang, wrongSpecialty, wrongName], {
        q: 'иванов',
        specialty: 'стоматолог',
        lang: 'ky',
      }),
    ).toEqual([target])
  })

  it('отдаёт пустой список, когда совпадений нет', () => {
    expect(filterDoctors([doctor()], { ...EMPTY_SEARCH_STATE, q: 'сидоров' })).toEqual([])
  })

  it('не меняет исходный массив и его порядок', () => {
    const first = doctor({ fullName: 'Яковлев Яков Яковлевич' })
    const second = doctor({ fullName: 'Абрамов Абрам Абрамович' })
    const items = [first, second]
    const result = filterDoctors(items, EMPTY_SEARCH_STATE)
    expect(items).toEqual([first, second])
    expect(result).not.toBe(items)
    expect(result).toEqual([first, second])
  })
})
