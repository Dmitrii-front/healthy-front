import { Icon, type IconName } from '@/shared/ui/Icon'

export interface SettingsItem {
  icon: IconName
  label: string
  meta?: string
  onClick?: () => void
}

interface SettingsListProps {
  items: SettingsItem[]
}

export function SettingsList({ items }: SettingsListProps) {
  return (
    <div className='border-hairline bg-card-white overflow-hidden rounded-[14px] border'>
      {items.map((it, i) => {
        const last = i === items.length - 1
        return (
          <button
            key={it.label}
            type='button'
            onClick={it.onClick}
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-transform active:scale-[0.992] ${
              last ? '' : 'border-hairline border-b'
            }`}
          >
            <span className='bg-linen-shade text-soft-graphite flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]'>
              <Icon name={it.icon} size={15} stroke={1.8} />
            </span>
            <span className='text-graphite flex-1 text-[14px]'>{it.label}</span>
            {it.meta && <span className='text-distant-graphite text-[12.5px]'>{it.meta}</span>}
            <Icon name='chevron-right' size={15} className='text-distant-graphite' />
          </button>
        )
      })}
    </div>
  )
}
