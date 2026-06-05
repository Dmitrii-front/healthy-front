import type { ReactNode } from 'react'

interface InfoListGroupProps {
  children: ReactNode
}

export function InfoListGroup({ children }: InfoListGroupProps) {
  return (
    <div className='border-hairline bg-card-white overflow-hidden rounded-[14px] border'>
      {children}
    </div>
  )
}

interface InfoListRowProps {
  label: string
  value: string
  last?: boolean
}

export function InfoListRow({ label, value, last }: InfoListRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-[13px] text-[13px] ${
        last ? '' : 'border-hairline border-b'
      }`}
    >
      <span className='text-distant-graphite shrink-0'>{label}</span>
      <span className='text-graphite overflow-hidden text-right text-[13.5px] font-medium text-ellipsis whitespace-nowrap'>
        {value}
      </span>
    </div>
  )
}
