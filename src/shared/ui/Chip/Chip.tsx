import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: IconName
  children: ReactNode
}

/**
 * 34px filter / segment chip. Active state uses graphite ink (not coral) to
 * keep coral reserved for the One Voice Rule (CTAs only).
 */
export function Chip({ active, icon, className, children, ...rest }: ChipProps) {
  return (
    <button
      type='button'
      {...rest}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-medium transition-colors',
        'h-[34px] whitespace-nowrap',
        active
          ? 'bg-graphite text-card-white'
          : 'bg-card-white text-soft-graphite border border-hairline hover:bg-linen-shade',
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} stroke={1.8} />}
      {children}
    </button>
  )
}
