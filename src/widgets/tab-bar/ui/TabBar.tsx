import { Link, useMatches } from '@tanstack/react-router'

import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    hideTabBar?: boolean
  }
}

interface TabItem {
  label: string
  icon: IconName
  to: string
  search?: Record<string, string>
}

const TABS: TabItem[] = [
  { label: 'Главная', icon: 'home', to: '/' },
  { label: 'Визиты', icon: 'calendar', to: '/visits', search: { tab: 'upcoming' } },
  { label: 'Мед карта', icon: 'file', to: '/history' },
  { label: 'Профиль', icon: 'user', to: '/profile' },
]

export function TabBar() {
  const matches = useMatches()
  const hide = matches.some((m) => m.staticData?.hideTabBar)
  if (hide) return null

  return (
    <nav
      className='border-hairline bg-card-white/85 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl backdrop-saturate-150 md:hidden'
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
    >
      <ul className='grid grid-cols-4 px-1 pt-1.5 pb-1'>
        {TABS.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              {...(tab.search ? { search: tab.search } : {})}
              activeProps={{
                className:
                  'flex flex-col items-center gap-1 px-2 py-1.5 text-[10.5px] font-semibold tracking-[0.01em] text-brick-teal',
              }}
              inactiveProps={{
                className:
                  'flex flex-col items-center gap-1 px-2 py-1.5 text-[10.5px] font-medium tracking-[0.01em] text-distant-graphite',
              }}
              activeOptions={{ exact: tab.to === '/' }}
            >
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} size={22} stroke={isActive ? 2 : 1.6} />
                  <span>{tab.label}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
