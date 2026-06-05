import { cn } from '@/shared/lib'
import { Icon } from '@/shared/ui/Icon'

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className='bg-brick-teal text-card-white flex h-8 w-8 items-center justify-center rounded-[9px]'>
        <Icon name='monogram-h' size={17} stroke={2} />
      </div>
      <span className='text-graphite text-[18px] font-medium tracking-tight'>Healthy</span>
    </div>
  )
}
