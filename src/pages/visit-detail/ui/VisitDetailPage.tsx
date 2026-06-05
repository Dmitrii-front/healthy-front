import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'

import { APPOINTMENT_QUERIES } from '@/entities/appointment'
import type { AppointmentStatus } from '@/entities/appointment'
import { DOCTOR_QUERIES } from '@/entities/doctor'
import { Avatar } from '@/shared/ui/Avatar'
import { Icon } from '@/shared/ui/Icon'

const RU_WEEKDAY = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const RU_FULL = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const RU_TIME = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: 'Подтверждено',
  pending: 'Ожидает подтверждения',
  cancelled: 'Отменено',
  completed: 'Завершено',
}

const STATUS_PILL: Record<AppointmentStatus, string> = {
  confirmed:
    'bg-[oklch(92%_0.05_165)] border border-[oklch(86%_0.06_165)] text-[oklch(38%_0.08_165)]',
  pending: 'bg-[oklch(94%_0.07_75)] border border-[oklch(88%_0.09_75)] text-pending-amber-deep',
  cancelled: 'bg-linen-shade border border-hairline text-distant-graphite',
  completed: 'bg-linen-shade border border-hairline text-distant-graphite',
}

const STATUS_DOT: Record<AppointmentStatus, string> = {
  confirmed: 'bg-[oklch(56%_0.13_165)]',
  pending: 'bg-pending-amber-deep',
  cancelled: 'bg-mist-graphite',
  completed: 'bg-mist-graphite',
}

export function VisitDetailPage() {
  const { visitId } = useParams({ from: '/visits/$visitId' })
  const router = useRouter()
  const { data: visit } = useQuery(APPOINTMENT_QUERIES.detail(visitId))
  const { data: doctors = [] } = useQuery(DOCTOR_QUERIES.list())

  const goBack = () => {
    if (router.history.canGoBack()) router.history.back()
    else void router.navigate({ to: '/visits', search: { tab: 'upcoming' } })
  }

  if (!visit) {
    return (
      <div className='px-5 pt-8 md:px-0 md:pt-0'>
        <BackButton onClick={goBack} />
        <p className='text-distant-graphite mt-6 text-[14px]'>Загружаем визит…</p>
      </div>
    )
  }

  const doctor = doctors.find((d) => d.id === visit.doctorId)
  const date = new Date(visit.date)
  const isPast = date.getTime() < Date.now() || visit.status === 'completed'

  return (
    <div className='px-4 pt-6 pb-10 md:px-0 md:pt-0 md:pb-0'>
      <BackButton onClick={goBack} />

      <header className='mt-5'>
        <span
          className={`inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 pl-2 text-[11.5px] leading-none font-medium ${STATUS_PILL[visit.status]}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[visit.status]}`} />
          {STATUS_LABEL[visit.status]}
        </span>
        <h1 className='text-graphite mt-3 text-[28px] leading-[1.08] font-medium tracking-[-0.022em] text-pretty'>
          {visit.type}
        </h1>
        <p className='text-soft-graphite mt-2 text-[15px] leading-relaxed'>
          {cap(RU_WEEKDAY.format(date))}, {RU_FULL.format(date)} · {RU_TIME.format(date)} ·{' '}
          {visit.duration} мин
        </p>
      </header>

      {doctor && (
        <section className='mt-7'>
          <p className='text-distant-graphite mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] uppercase'>
            Доктор
          </p>
          <div className='border-hairline bg-card-white flex items-center gap-3 rounded-[16px] border p-3.5'>
            <Avatar initials={doctor.initials} color={doctor.color} size={48} />
            <div className='min-w-0 flex-1'>
              <p className='text-graphite text-[15px] leading-tight font-medium tracking-[-0.005em] text-pretty'>
                {doctor.name}
              </p>
              <p className='text-distant-graphite mt-0.5 text-[13px]'>{doctor.specialty}</p>
            </div>
          </div>
        </section>
      )}

      <section className='mt-7'>
        <p className='text-distant-graphite mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] uppercase'>
          Клиника
        </p>
        <div className='border-hairline bg-card-white rounded-[16px] border p-4'>
          <p className='text-graphite text-[14.5px] leading-tight font-medium'>{visit.clinic}</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(visit.clinic)}`}
            target='_blank'
            rel='noopener'
            className='text-clinic-teal hover:text-brick-teal mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium'
          >
            <Icon name='pin' size={14} stroke={1.8} />
            Маршрут
          </a>
        </div>
      </section>

      {visit.notes && (
        <section className='mt-7'>
          <p className='text-distant-graphite mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] uppercase'>
            Заметка
          </p>
          <div className='border-hairline bg-card-white text-soft-graphite rounded-[16px] border p-4 text-[13.5px] leading-relaxed'>
            <p>{visit.notes}</p>
          </div>
        </section>
      )}

      {!isPast && visit.status !== 'cancelled' && (
        <section className='mt-7 flex flex-col gap-2.5 md:flex-row'>
          <button
            type='button'
            disabled
            className='rounded-pill border-hairline bg-card-white text-soft-graphite flex h-12 w-full items-center justify-center border px-5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-70 md:flex-1'
            title='Скоро'
          >
            Перенести
          </button>
          <button
            type='button'
            disabled
            className='rounded-pill border-hairline bg-card-white text-soft-graphite flex h-12 w-full items-center justify-center border px-5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-70 md:flex-1'
            title='Скоро'
          >
            Отменить
          </button>
        </section>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='text-soft-graphite hover:text-graphite -ml-1 inline-flex items-center gap-1.5 px-1 py-1 text-[13px] font-medium transition-colors'
    >
      <Icon name='chevron-left' size={16} stroke={2} />
      Назад
    </button>
  )
}
