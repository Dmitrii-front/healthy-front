import type { ReactNode } from 'react'

interface ProfileSectionProps {
  title: string
  children: ReactNode
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section className='mt-6'>
      <p className='text-distant-graphite mb-2 px-1 text-[11px] font-medium tracking-[0.06em] uppercase'>
        {title}
      </p>
      {children}
    </section>
  )
}
