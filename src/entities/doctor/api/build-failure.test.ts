import { afterEach, describe, expect, it, vi } from 'vitest'

import { failBuild } from './build-failure'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('failBuild', () => {
  it('бросает с переданным сообщением', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => failBuild('каталог пуст')).toThrow('каталог пуст')
  })

  it('печатает сообщение до броска — иначе воркер его съест', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => failBuild('каталог пуст')).toThrow()
    expect(spy).toHaveBeenCalledWith('[doctors] каталог пуст')
  })
})
