import type { ReactNode } from 'react'

interface RecordSectionProps {
  title: string
  last?: boolean
  children: ReactNode
}

export function RecordSection({ title, last, children }: RecordSectionProps) {
  return (
    <div className={last ? 'mb-6' : 'mb-[18px]'}>
      <p className='text-distant-graphite mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] uppercase'>
        {title}
      </p>
      <div className='border-hairline bg-card-white flex flex-col rounded-[14px] border'>
        {children}
      </div>
    </div>
  )
}
