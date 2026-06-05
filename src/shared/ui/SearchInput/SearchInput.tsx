import type { InputHTMLAttributes } from 'react'

import { cn } from '@/shared/lib'
import { Icon } from '@/shared/ui/Icon'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Поиск',
  className,
  ...rest
}: SearchInputProps) {
  return (
    <label
      className={cn(
        'flex h-[44px] w-full items-center gap-2 rounded-[14px] border border-hairline bg-card-white px-3.5 text-[14px] text-graphite',
        'focus-within:border-soft-graphite',
        className,
      )}
    >
      <Icon name='search' size={16} stroke={1.8} className='text-distant-graphite shrink-0' />
      <input
        {...rest}
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='placeholder:text-distant-graphite min-w-0 flex-1 bg-transparent outline-none'
      />
      {value.length > 0 && (
        <button
          type='button'
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          aria-label='Очистить'
          className='bg-mist-graphite/40 text-card-white grid h-5 w-5 shrink-0 place-items-center rounded-full'
        >
          <Icon name='x' size={11} stroke={2.4} />
        </button>
      )}
    </label>
  )
}
