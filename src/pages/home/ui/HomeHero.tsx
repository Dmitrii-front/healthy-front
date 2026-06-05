import { useNavigate } from '@tanstack/react-router'

import type { Appointment } from '@/entities/appointment'
import type { Doctor } from '@/entities/doctor'
import { Icon } from '@/shared/ui/Icon'

import { NextVisitCard } from './NextVisitCard'

interface HomeHeroProps {
  appointments: Appointment[]
  doctors: Doctor[]
}

const RU_MONTH_DAY = new Intl.DateTimeFormat('ru-RU', { month: 'long', day: 'numeric' })

/**
 * Home dashboard hero. Routes between three states without a discovery flow
 * (search/booking lives on the Astro marketing site):
 *
 *  • A  — upcoming appointment: surface the nearest one as the focal card.
 *  • B' — no upcoming, has past visit: continuity prompt with a deep-link
 *         back into /search?specialty=… on the marketing site.
 *  • B  — cold idle: calm illustration + soft CTA to /search.
 */
export function HomeHero({ appointments, doctors }: HomeHeroProps) {
  const now = Date.now()

  const upcoming = appointments
    .filter((a) => new Date(a.date).getTime() >= now && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const past = appointments
    .filter((a) => new Date(a.date).getTime() < now && a.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const nextAppointment = upcoming[0]
  const lastPastAppointment = past[0]

  if (nextAppointment) {
    const doctor = doctors.find((d) => d.id === nextAppointment.doctorId)
    if (doctor) return <UpcomingHero appointment={nextAppointment} doctor={doctor} />
  }

  if (lastPastAppointment) {
    const doctor = doctors.find((d) => d.id === lastPastAppointment.doctorId)
    if (doctor) return <ContinuityHero appointment={lastPastAppointment} doctor={doctor} />
  }

  return <IdleHero />
}

/* ── State A — upcoming visit ───────────────────────────────────────────── */

function UpcomingHero({ appointment, doctor }: { appointment: Appointment; doctor: Doctor }) {
  const navigate = useNavigate()
  return (
    <NextVisitCard
      appointment={appointment}
      doctor={doctor}
      onOpen={() => void navigate({ to: '/visits/$visitId', params: { visitId: appointment.id } })}
    />
  )
}

/* ── State B' — continuity prompt (has past visit) ──────────────────────── */

function ContinuityHero({ appointment, doctor }: { appointment: Appointment; doctor: Doctor }) {
  const date = new Date(appointment.date)
  const rebookHref = `/search?specialty=${encodeURIComponent(doctor.specialty)}`

  return (
    <section className='border-hairline bg-card-white w-full overflow-hidden rounded-[22px] border'>
      <div
        className='px-5 pt-4 pb-5'
        style={{
          background:
            'radial-gradient(140% 100% at 80% 0%, color-mix(in oklch, var(--color-tinted-linen) 90%, var(--color-card-white)) 0%, var(--color-card-white) 70%)',
        }}
      >
        <p className='text-brick-teal text-[11px] font-semibold tracking-[0.09em] uppercase'>
          Продолжение заботы
        </p>
        <p className='text-graphite mt-3.5 text-[24px] leading-[1.12] font-medium tracking-[-0.02em] text-pretty'>
          Прошлый визит — {RU_MONTH_DAY.format(date)}
        </p>
        <p className='text-soft-graphite mt-1.5 text-[14px] leading-relaxed'>
          {doctor.specialty} · {doctor.name}.
          {appointment.notes ? ` ${appointment.notes}` : ' Поддерживайте регулярные осмотры.'}
        </p>

        <a
          href={rebookHref}
          className='rounded-pill bg-clinic-teal text-card-white hover:bg-brick-teal mt-5 inline-flex h-12 items-center gap-2 pr-4 pl-5 text-[14.5px] font-medium tracking-[-0.005em] shadow-[0_8px_18px_-8px_color-mix(in_oklch,var(--color-clinic-teal)_55%,transparent)] transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px active:translate-y-px'
        >
          Записать повторный
          <Icon name='arrow-right' size={16} stroke={2} />
        </a>
      </div>
    </section>
  )
}

/* ── State B — cold idle ────────────────────────────────────────────────── */

function IdleHero() {
  return (
    <section
      className='border-hairline bg-card-white relative w-full overflow-hidden rounded-[22px] border px-6 pt-7 pb-7'
      style={{
        background:
          'radial-gradient(120% 90% at 75% -10%, color-mix(in oklch, var(--color-tinted-linen) 95%, var(--color-card-white)) 0%, var(--color-card-white) 70%)',
      }}
    >
      <IdleGlyph />

      <p className='text-brick-teal mt-1 text-[11px] font-semibold tracking-[0.09em] uppercase'>
        Сейчас
      </p>
      <h2 className='text-graphite mt-3 max-w-[16ch] text-[26px] leading-[1.1] font-medium tracking-[-0.02em] text-pretty'>
        Визитов пока не запланировано.
      </h2>
      <p className='text-soft-graphite mt-2 max-w-[36ch] text-[14px] leading-relaxed text-pretty'>
        Когда понадобится — запишитесь в один клик. Сохраняйте свою медкарту под рукой.
      </p>

      <a
        href='/search'
        className='rounded-pill bg-clinic-teal text-card-white hover:bg-brick-teal mt-6 inline-flex h-12 items-center gap-2 pr-4 pl-5 text-[14.5px] font-medium tracking-[-0.005em] shadow-[0_8px_18px_-8px_color-mix(in_oklch,var(--color-clinic-teal)_55%,transparent)] transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px active:translate-y-px'
      >
        Записать на приём
        <Icon name='arrow-right' size={16} stroke={2} />
      </a>
    </section>
  )
}

/* Decorative glyph — two concentric arcs in brand teal, soft fade. Composited
   transform-only, no perpetual animation (calm idle state, not "alive"). */
function IdleGlyph() {
  return (
    <svg
      width='58'
      height='58'
      viewBox='0 0 58 58'
      fill='none'
      aria-hidden='true'
      className='opacity-90'
    >
      <circle cx='29' cy='29' r='22' stroke='var(--color-clinic-teal)' strokeWidth='1.4' />
      <circle
        cx='29'
        cy='29'
        r='13'
        stroke='var(--color-clinic-teal)'
        strokeWidth='1.4'
        opacity='0.55'
      />
      <path
        d='M21 29.5L26.5 35L37 24'
        stroke='var(--color-clinic-teal)'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
