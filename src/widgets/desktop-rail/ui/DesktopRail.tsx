import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { PATIENT_QUERIES } from '@/entities/patient'
import { useCurrentUser } from '@/features/auth'
import { Avatar } from '@/shared/ui/Avatar'
import { BrandMark } from '@/shared/ui/BrandMark'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'

interface NavItem {
  label: string
  icon: IconName
  to: string
  search?: Record<string, string>
  matchExact?: boolean
}

const NAV: NavItem[] = [
  { label: 'Главная', icon: 'home', to: '/', matchExact: true },
  { label: 'Визиты', icon: 'calendar', to: '/visits', search: { tab: 'upcoming' } },
  { label: 'Мед карта', icon: 'file', to: '/history' },
  { label: 'Профиль', icon: 'user', to: '/profile' },
]

/**
 * Desktop side-rail (≥768px). Brand mark on top, primary nav in the middle,
 * user chip at the bottom. Sticky to viewport height so it stays visible as
 * the main column scrolls. Hidden on mobile — the bottom TabBar covers that
 * case.
 */
export function DesktopRail() {
  const { data: user } = useCurrentUser()
  const { data: patient } = useQuery(PATIENT_QUERIES.current())

  const displayName = patient?.firstName ?? user?.email?.split('@')[0] ?? 'Пациент'
  const initials = patient?.initials ?? displayName.slice(0, 2).toUpperCase()

  return (
    <aside className='md:border-hairline md:bg-card-white hidden md:sticky md:top-0 md:flex md:h-dvh md:w-[240px] md:shrink-0 md:flex-col md:gap-2 md:border-r md:px-5 md:py-7 lg:w-[260px]'>
      <div className='px-1.5'>
        <BrandMark />
      </div>

      <nav className='mt-7 flex flex-col gap-0.5'>
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            {...(item.search ? { search: item.search } : {})}
            {...(item.matchExact ? { activeOptions: { exact: true } } : {})}
            activeProps={{
              className:
                'flex items-center gap-3 rounded-[10px] bg-tinted-linen px-3 py-2.5 text-[14px] font-medium text-graphite',
            }}
            inactiveProps={{
              className:
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-soft-graphite transition-colors hover:bg-graphite/[0.03] hover:text-graphite',
            }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  size={18}
                  stroke={isActive ? 2 : 1.7}
                  className={isActive ? 'text-clinic-teal' : ''}
                />
                <span>{item.label}</span>
              </>
            )}
          </Link>
        ))}
      </nav>

      <div className='border-hairline bg-warm-paper/40 mt-auto flex items-center gap-3 rounded-[14px] border px-3 py-2.5'>
        <Avatar initials={initials} size={32} />
        <div className='min-w-0 flex-1'>
          <p className='text-graphite truncate text-[13px] leading-tight font-medium'>
            {displayName}
          </p>
          {user?.email && (
            <p className='text-distant-graphite truncate text-[11.5px] leading-tight'>
              {user.email}
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
