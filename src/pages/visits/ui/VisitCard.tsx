import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import type { Doctor } from '@/entities/doctor'
import { RU_MONTHS_SHORT } from '@/shared/lib'
import { Icon } from '@/shared/ui/Icon'

interface VisitCardProps {
  appointment: Appointment
  doctor: Doctor
  past?: boolean
  primary?: boolean
  onClick?: () => void
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: 'Подтверждено',
  pending: 'Ожидает подтверждения',
  cancelled: 'Отменён',
  completed: 'Завершено',
}

const STATUS_STRIPE: Record<AppointmentStatus, string> = {
  confirmed: 'oklch(72% 0.14 160)',
  pending: 'oklch(78% 0.16 75)',
  cancelled: 'var(--color-distant-graphite)',
  completed: 'var(--color-distant-graphite)',
}

const RU_TIME = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function VisitCard({
  appointment,
  doctor,
  past = false,
  primary = false,
  onClick,
}: VisitCardProps) {
  const date = new Date(appointment.date)
  const month = RU_MONTHS_SHORT[date.getMonth()] ?? ''
  const day = date.getDate()
  const isPending = appointment.status === 'pending'

  return (
    <button
      type='button'
      onClick={onClick}
      className='border-hairline bg-card-white block w-full overflow-hidden rounded-[16px] border text-left transition-transform active:scale-[0.99]'
      style={primary && !past ? { borderTopColor: 'var(--color-tinted-linen)' } : undefined}
    >
      <div className='relative flex flex-col'>
        <div className='relative flex items-stretch overflow-hidden'>
          {/* 2px status stripe — only on upcoming/non-past cards */}
          {!past && (
            <span
              aria-hidden
              className='absolute top-0 bottom-0 left-0 w-[2px] rounded-l-[2px]'
              style={{ background: STATUS_STRIPE[appointment.status] }}
            />
          )}

          {/* Date column — month / day / hairline / time-or-year */}
          <div
            className={`border-hairline flex w-16 shrink-0 flex-col items-center justify-center border-r text-center ${
              primary && !past ? 'py-3.5' : 'py-3'
            }`}
          >
            <span className='text-distant-graphite text-[10px] font-bold tracking-[0.16em] uppercase'>
              {month}
            </span>
            <span
              className={`text-graphite mt-1 leading-none font-semibold tracking-[-0.02em] tabular-nums ${
                primary && !past ? 'text-[32px]' : 'text-[28px]'
              }`}
            >
              {day}
            </span>
            <span aria-hidden className='bg-graphite/5 my-2 block h-px w-6' />
            <span className='text-soft-graphite font-mono text-[13px] font-medium tracking-[-0.01em] tabular-nums'>
              {past ? date.getFullYear() : RU_TIME.format(date)}
            </span>
          </div>

          {/* Main column */}
          <div
            className={`flex min-w-0 flex-1 flex-col ${
              primary && !past ? 'px-[18px] py-3.5' : 'px-3.5 py-3'
            }`}
          >
            <p className='font-display text-graphite text-[16px] font-semibold'>
              {appointment.type}
            </p>

            {!past && (
              <span
                className={`mt-0.5 mb-1.5 inline-flex self-start text-[10px] leading-none font-semibold tracking-[0.12em] uppercase ${
                  isPending
                    ? 'bg-pending-amber/10 text-pending-amber-deep rounded-[4px] px-1.5 py-1'
                    : 'text-distant-graphite'
                }`}
              >
                {STATUS_LABEL[appointment.status]} · {appointment.duration} мин
              </span>
            )}

            <p className={`text-graphite text-[13.5px] font-medium ${past ? 'mt-1' : ''}`}>
              {doctor.name}
            </p>

            <p className='text-distant-graphite mt-1 flex items-center text-[12px]'>
              <PinIcon className='mr-1 shrink-0' />
              {doctor.clinic}
            </p>
          </div>
        </div>

        {/* Prep note — hairline + info icon (upcoming only) */}
        {!past && appointment.notes && (
          <>
            <span aria-hidden className='bg-graphite/5 mx-[18px] block h-px' />
            <div className='text-distant-graphite flex items-start gap-2 px-[18px] py-3 text-[12.5px] leading-relaxed'>
              <Icon name='info' size={13} stroke={2} className='mt-0.5 shrink-0' />
              <span>{appointment.notes}</span>
            </div>
          </>
        )}
      </div>
    </button>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width={11}
      height={11}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
      className={className}
    >
      <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' />
      <circle cx='12' cy='10' r='3' />
    </svg>
  )
}
