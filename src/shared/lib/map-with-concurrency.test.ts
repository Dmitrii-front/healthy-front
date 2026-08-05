import { describe, expect, it } from 'vitest'

import { mapWithConcurrency } from './map-with-concurrency'

describe('mapWithConcurrency', () => {
  it('сохраняет порядок результатов, а не порядок завершения', async () => {
    // Первый элемент отвечает дольше всех — он всё равно обязан остаться первым.
    const delays = [30, 20, 10, 0]
    const result = await mapWithConcurrency(delays, 2, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms))
      return ms
    })
    expect(result).toEqual([30, 20, 10, 0])
  })

  it('не запускает больше задач, чем разрешено лимитом', async () => {
    let running = 0
    let peak = 0

    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async (n) => {
        running += 1
        peak = Math.max(peak, running)
        await new Promise((resolve) => setTimeout(resolve, 1))
        running -= 1
        return n
      },
    )

    expect(peak).toBeLessThanOrEqual(3)
    expect(peak).toBeGreaterThan(1)
  })

  it('обрабатывает весь список, когда он длиннее лимита', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const result = await mapWithConcurrency(items, 8, async (n) => n * 2)
    expect(result).toHaveLength(50)
    expect(result[49]).toBe(98)
  })

  it('отдаёт пустой список для пустого входа и не зовёт обработчик', async () => {
    let calls = 0
    const result = await mapWithConcurrency([], 4, async (n: number) => {
      calls += 1
      return n
    })
    expect(result).toEqual([])
    expect(calls).toBe(0)
  })

  it('пробрасывает ошибку обработчика наверх', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('обработчик упал')
        return n
      }),
    ).rejects.toThrow('обработчик упал')
  })
})
