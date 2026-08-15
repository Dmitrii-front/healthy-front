import { describe, expect, it } from 'vitest'

import { serializeForJsonIsland } from './serialize'

describe('serializeForJsonIsland', () => {
  it('сериализует обычные данные как JSON', () => {
    const json = serializeForJsonIsland({ items: [{ name: 'Иванов Иван' }] })
    expect(JSON.parse(json)).toEqual({ items: [{ name: 'Иванов Иван' }] })
  })

  it('не оставляет в выводе закрывающий тег script', () => {
    // Название клиники с разметкой разорвало бы документ: браузер закрыл бы
    // островок раньше времени, остаток строки утёк бы в разметку страницы.
    const json = serializeForJsonIsland({
      clinic: 'Зубная фея </script><img src=x onerror=alert(1)>',
    })
    expect(json).not.toContain('</script>')
    expect(json).not.toContain('<img')
  })

  it('переживает открывающий тег и начало комментария', () => {
    const json = serializeForJsonIsland({ a: '<script>', b: '<!--' })
    expect(json).not.toContain('<script>')
    expect(json).not.toContain('<!--')
  })

  it('после экранирования данные читаются без потерь', () => {
    const value = { clinic: 'Зубная фея </script>', note: '<!-- 5 < 6 -->' }
    expect(JSON.parse(serializeForJsonIsland(value))).toEqual(value)
  })

  it('не трогает кириллицу — она весит два байта, а не шесть', () => {
    const json = serializeForJsonIsland({ city: 'Бишкек' })
    expect(json).toContain('Бишкек')
    expect(json).not.toContain('\\u0411')
  })
})
