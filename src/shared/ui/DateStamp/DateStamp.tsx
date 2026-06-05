const RU_MONTHS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const

interface DateStampProps {
  date: Date
  showTime?: boolean
}

export function DateStamp({ date, showTime = true }: DateStampProps) {
  const month = RU_MONTHS[date.getMonth()]
  const day = date.getDate()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return (
    <div className='flex w-16 flex-col items-center justify-center py-3'>
      <span className='text-distant-graphite text-[10px] font-bold tracking-[0.16em] uppercase'>
        {month}
      </span>
      <span className='text-graphite mt-1 text-[28px] leading-none font-semibold tracking-tight tabular-nums'>
        {day}
      </span>
      {showTime && (
        <>
          <span aria-hidden className='my-2 block h-px w-6 bg-black/5' />
          <span className='text-soft-graphite font-mono text-[13px] font-medium tracking-tight tabular-nums'>
            {time}
          </span>
        </>
      )}
    </div>
  )
}
