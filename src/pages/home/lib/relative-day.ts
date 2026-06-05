/** Russian "in N days" with proper plural form (день / дня / дней). */
export function ruDaysFromNow(target: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(target) - startOf(now)) / 86_400_000)

  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  if (days === -1) return 'Вчера'
  if (days < 0) return target.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  const mod10 = days % 10
  const mod100 = days % 100
  let unit = 'дней'
  if (mod10 === 1 && mod100 !== 11) unit = 'день'
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20)) unit = 'дня'
  return `Через ${days} ${unit}`
}
