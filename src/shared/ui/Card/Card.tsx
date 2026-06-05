import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('rounded-2xl bg-card-white border border-hairline', className)} {...rest}>
      {children}
    </div>
  )
}
