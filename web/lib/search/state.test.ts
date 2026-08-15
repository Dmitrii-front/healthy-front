import { describe, expect, it } from 'vitest'

import { activeChips, buildSearchQuery, readSearchState } from './state'
import type { SearchState } from './state'

describe('readSearchState', () => {
  it('читает три параметра', () => {
    expect(readSearchState('?q=иванов&specialty=стоматолог&lang=ky')).toEqual({
      q: 'иванов',
      specialty: 'стоматолог',
      lang: 'ky',
    })
  })

  it('отдаёт пустое состояние, когда параметров нет', () => {
    expect(readSearchState('')).toEqual({ q: '', specialty: '', lang: '' })
    expect(readSearchState('?')).toEqual({ q: '', specialty: '', lang: '' })
  })

  it('игнорирует параметры, которых больше нет', () => {
    // sort, rating, exp, accepting, format и city страница читала и рисовала
    // ими чипы, но ни один не влиял на выдачу.
    expect(
      readSearchState('?q=тест&sort=near&rating=4.5&exp=10&accepting=1&format=online&city=Бишкек'),
    ).toEqual({ q: 'тест', specialty: '', lang: '' })
  })

  it('обрезает пробелы вокруг запроса', () => {
    expect(readSearchState('?q=%20%20иванов%20%20').q).toBe('иванов')
  })

  it('приводит ключ специальности и код языка к нижнему регистру', () => {
    // Регистр в ссылке извне может быть любым, а ключ обязан совпасть с тем,
    // что лежит в каталоге.
    expect(readSearchState('?specialty=Стоматолог&lang=KY')).toEqual({
      q: '',
      specialty: 'стоматолог',
      lang: 'ky',
    })
  })
})

describe('buildSearchQuery', () => {
  it('собирает строку из всех значений', () => {
    const query = buildSearchQuery({ q: 'иванов', specialty: 'стоматолог', lang: 'ky' })
    expect(decodeURIComponent(query)).toBe('q=иванов&specialty=стоматолог&lang=ky')
  })

  it('пропускает пустые значения', () => {
    const query = buildSearchQuery({ q: '', specialty: 'стоматолог', lang: '' })
    expect(decodeURIComponent(query)).toBe('specialty=стоматолог')
  })

  it('отдаёт пустую строку для пустого состояния', () => {
    expect(buildSearchQuery({ q: '', specialty: '', lang: '' })).toBe('')
  })

  it('переживает круговой обход', () => {
    const state: SearchState = { q: 'иванов и+сын', specialty: 'стоматолог', lang: 'ky' }
    expect(readSearchState('?' + buildSearchQuery(state))).toEqual(state)
  })
})

describe('activeChips', () => {
  const specialtyLabels = { стоматолог: 'Стоматолог' }
  const languageLabels = { ky: 'Кыргызча' }

  it('не показывает чипов при пустом состоянии', () => {
    expect(
      activeChips({ q: '', specialty: '', lang: '' }, specialtyLabels, languageLabels),
    ).toEqual([])
  })

  it('показывает подпись специальности, а не ключ', () => {
    expect(
      activeChips({ q: '', specialty: 'стоматолог', lang: '' }, specialtyLabels, languageLabels),
    ).toEqual([{ key: 'specialty', label: 'Стоматолог' }])
  })

  it('показывает подпись языка, а не код', () => {
    expect(
      activeChips({ q: '', specialty: '', lang: 'ky' }, specialtyLabels, languageLabels),
    ).toEqual([{ key: 'lang', label: 'Кыргызча' }])
  })

  it('показывает запрос в кавычках', () => {
    expect(
      activeChips({ q: 'иванов', specialty: '', lang: '' }, specialtyLabels, languageLabels),
    ).toEqual([{ key: 'q', label: '«иванов»' }])
  })

  it('падает обратно на сырое значение, если подписи нет', () => {
    // Ссылка из индекса поисковика может нести специальность, которой в
    // каталоге уже нет, — чип обязан остаться снимаемым.
    expect(
      activeChips({ q: '', specialty: 'знахарь', lang: 'xx' }, specialtyLabels, languageLabels),
    ).toEqual([
      { key: 'specialty', label: 'знахарь' },
      { key: 'lang', label: 'xx' },
    ])
  })

  it('перечисляет все активные фильтры разом', () => {
    expect(
      activeChips(
        { q: 'иванов', specialty: 'стоматолог', lang: 'ky' },
        specialtyLabels,
        languageLabels,
      ),
    ).toEqual([
      { key: 'q', label: '«иванов»' },
      { key: 'specialty', label: 'Стоматолог' },
      { key: 'lang', label: 'Кыргызча' },
    ])
  })
})
