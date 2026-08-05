/**
 * Обходит список, держа в работе не больше `limit` задач одновременно.
 *
 * Нужна на сборке витрины: каталог врачей обходится запросом на каждого, и
 * голый Promise.all открыл бы столько соединений, сколько врачей в базе.
 * Порядок результатов соответствует порядку входа, а не порядку завершения.
 *
 * Первая же ошибка обработчика уходит наверх — вызывающая сторона решает,
 * останавливать сборку или нет.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    // Задачи внутри воркера обязаны идти последовательно: воркер и есть
    // граница одновременности, которую задаёт limit, — parallel здесь её сломает.
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined) continue
      // eslint-disable-next-line eslint/no-await-in-loop
      results[index] = await fn(item, index)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)

  return results
}
