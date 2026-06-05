import type { Appointment } from '@/entities/appointment'
import type { Doctor } from '@/entities/doctor'
import { Avatar } from '@/shared/ui/Avatar'
import { Icon } from '@/shared/ui/Icon'

import { ruDaysFromNow } from '../lib/relative-day'

interface NextVisitCardProps {
  appointment: Appointment
  doctor: Doctor
  onOpen?: () => void
  onOpenDoctor?: () => void
}

const RU_TIME = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const RU_WEEKDAY = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const RU_MONTH_DAY = new Intl.DateTimeFormat('ru-RU', { month: 'long', day: 'numeric' })

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const STATUS_LABEL: Record<Appointment['status'], string> = {
  confirmed: 'Подтверждено',
  pending: 'Ожидает',
  cancelled: 'Отменено',
  completed: 'Завершено',
}

const STATUS_PILL: Record<Appointment['status'], string> = {
  confirmed:
    'bg-[oklch(92%_0.05_165)] border border-[oklch(86%_0.06_165)] text-[oklch(38%_0.08_165)]',
  pending: 'bg-[oklch(94%_0.07_75)] border border-[oklch(88%_0.09_75)] text-pending-amber-deep',
  cancelled: 'bg-linen-shade border border-hairline text-distant-graphite',
  completed: 'bg-linen-shade border border-hairline text-distant-graphite',
}

const STATUS_DOT: Record<Appointment['status'], string> = {
  confirmed: 'bg-[oklch(56%_0.13_165)]',
  pending: 'bg-pending-amber-deep',
  cancelled: 'bg-mist-graphite',
  completed: 'bg-mist-graphite',
}

export function NextVisitCard({ appointment, doctor, onOpen, onOpenDoctor }: NextVisitCardProps) {
  const date = new Date(appointment.date)
  const eyebrow = ruDaysFromNow(date)

  return (
    <div className='border-hairline w-full overflow-hidden rounded-[22px] border'>
      <button
        type='button'
        onClick={onOpen}
        className='block w-full cursor-pointer border-0 px-4 pt-3.5 pb-4 text-left'
        style={{
          background:
            'radial-gradient(140% 100% at 80% 10%, color-mix(in oklch, var(--color-tinted-linen) 90%, var(--color-card-white)) 0%, var(--color-card-white) 65%)',
        }}
      >
        <div className='flex min-h-[22px] items-center justify-between gap-2.5'>
          <span className='text-brick-teal max-w-[60%] text-[11px] leading-snug font-semibold tracking-[0.09em] uppercase'>
            Следующий визит · {eyebrow}
          </span>
          <span
            className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 pl-2 text-[11.5px] leading-none font-medium ${STATUS_PILL[appointment.status]}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[appointment.status]}`}
            />
            {STATUS_LABEL[appointment.status]}
          </span>
        </div>

        <p className='text-graphite mt-3.5 text-[28px] leading-[1.05] font-medium tracking-[-0.022em]'>
          {cap(RU_WEEKDAY.format(date))}, {RU_TIME.format(date)}
        </p>
        <p className='text-soft-graphite mt-1 text-[13.5px]'>
          {RU_MONTH_DAY.format(date)} · {appointment.type}
        </p>

        {appointment.notes && (
          <div className='border-hairline bg-card-white/85 mt-3.5 flex items-start gap-2.5 rounded-md border px-3 py-2.5'>
            <Icon name='info' size={15} stroke={2} className='text-brick-teal mt-0.5 shrink-0' />
            <p className='text-soft-graphite text-[13px] leading-snug'>
              <span className='text-graphite font-medium'>Перед визитом — </span>
              {appointment.notes}
            </p>
          </div>
        )}
      </button>

      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onOpenDoctor?.()
        }}
        className='border-hairline bg-card-white flex w-full items-center gap-3 border-0 border-t px-4 py-3 text-left'
      >
        <Avatar initials={doctor.initials} color={doctor.color} size={42} />
        <div className='min-w-0 flex-1'>
          <p className='text-graphite line-clamp-2 text-[14.5px] leading-tight font-medium tracking-[-0.005em] text-pretty'>
            {doctor.name}
          </p>
          <p className='text-distant-graphite mt-0.5 truncate text-[12.5px]'>
            {doctor.specialty} · {doctor.clinic}
          </p>
        </div>
        <Icon
          name='chevron-right'
          size={16}
          stroke={2}
          className='text-distant-graphite shrink-0'
        />
      </button>
    </div>
  )
}
