import type { InputHTMLAttributes, Ref } from 'react'
import { useState } from 'react'

import { cn } from '@/shared/lib'
import { Icon, type IconName } from '@/shared/ui/Icon'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: IconName
  invalid?: boolean
  /** Show an eye toggle for password fields. Switches `type` between `password` and `text`. */
  revealable?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({ ref, icon, invalid, revealable, type, className, ...rest }: InputProps) {
  const [revealed, setRevealed] = useState(false)
  const effectiveType = revealable && revealed ? 'text' : type

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 h-12.5 pl-3.5 bg-card-white border rounded-md',
        revealable ? 'pr-1' : 'pr-3.5',
        'transition-[border-color,box-shadow] duration-150 focus-within:ring-2',
        invalid
          ? 'border-brick-teal focus-within:border-brick-teal focus-within:ring-brick-teal/20'
          : 'border-hairline-strong focus-within:border-clinic-teal focus-within:ring-clinic-teal/15',
        className,
      )}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          className={cn(
            'shrink-0 transition-colors duration-150',
            invalid
              ? 'text-brick-teal/80'
              : 'text-distant-graphite group-focus-within:text-clinic-teal/70',
          )}
        />
      )}
      <input
        ref={ref}
        type={effectiveType}
        className='text-graphite placeholder:text-distant-graphite h-full min-w-0 flex-1 border-0 bg-transparent text-[15.5px] outline-none'
        {...rest}
      />
      {revealable && (
        <button
          type='button'
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={revealed}
          className='text-distant-graphite hover:text-graphite focus-visible:outline-clinic-teal/40 grid h-11 w-11 shrink-0 place-items-center rounded-md focus-visible:outline'
        >
          <Icon name={revealed ? 'eye-off' : 'eye'} size={18} />
        </button>
      )}
    </div>
  )
}
