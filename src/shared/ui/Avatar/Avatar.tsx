import { cn } from '@/shared/lib'

interface AvatarProps {
  initials: string
  color?: string
  size?: number
  className?: string
}

export function Avatar({ initials, color = '#E8D5C4', size = 42, className }: AvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'shrink-0 inline-flex items-center justify-center rounded-full font-medium text-graphite',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.36),
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  )
}
