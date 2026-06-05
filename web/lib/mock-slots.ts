/**
 * Mock slot generator for the public booking modal prototype.
 * Builds the next 7 days × 5 slots/day with a few marked as taken.
 */

export interface Slot {
  id: string
  /** ISO datetime of the slot start. */
  startsAt: string
  /** "10:00" formatted time label. */
  timeLabel: string
  available: boolean
}

export interface DaySlots {
  /** ISO date "2026-05-12". */
  date: string
  /** Localised label "Пн, 12 мая". */
  label: string
  /** Short label "Пн / 12". */
  shortLabel: string
  slots: Slot[]
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTH_NAMES = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

const TIMES = ['09:00', '10:30', '12:00', '14:30', '16:00']

export function generateMockSlots(doctorId: string, days = 7): DaySlots[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result: DaySlots[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const slots: Slot[] = TIMES.map((timeLabel, idx) => {
      const [h, m] = timeLabel.split(':').map(Number)
      const dt = new Date(date)
      dt.setHours(h ?? 0, m ?? 0, 0, 0)
      // Pseudo-random "taken" pattern so the UI shows a mix.
      const seed = (doctorId.charCodeAt(0) + i * 3 + idx * 7) % 5
      return {
        id: `${doctorId}-${i}-${idx}`,
        startsAt: dt.toISOString(),
        timeLabel,
        available: seed !== 1 && seed !== 4,
      }
    })

    result.push({
      date: toIsoDate(date),
      label: `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`,
      shortLabel: `${DAY_NAMES[date.getDay()]} / ${date.getDate()}`,
      slots,
    })
  }
  return result
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatSlotForDisplay(startsAt: string): string {
  const d = new Date(startsAt)
  const day = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const dow = DAY_NAMES[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dow}, ${day} ${month} · ${hh}:${mm}`
}
