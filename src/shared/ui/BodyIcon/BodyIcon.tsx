import type { CSSProperties } from 'react'

import {
  brainSrc,
  eyeSrc,
  heartSrc,
  jointsSrc,
  odsSrc,
  stomachSrc,
  toothSrc,
  traumaSrc,
} from '@/shared/assets'

export type BodyIconName =
  | 'heart'
  | 'brain'
  | 'stomach'
  | 'joints'
  | 'eye'
  | 'tooth'
  | 'trauma'
  | 'ods'

const SOURCES: Record<BodyIconName, string> = {
  heart: heartSrc,
  brain: brainSrc,
  stomach: stomachSrc,
  joints: jointsSrc,
  eye: eyeSrc,
  tooth: toothSrc,
  trauma: traumaSrc,
  ods: odsSrc,
}

interface BodyIconProps {
  name: BodyIconName
  size?: number
  className?: string
  style?: CSSProperties
}

/**
 * Body-part illustrations for specialty tiles. Each SVG keeps its own
 * full-color artwork, so they render via `<img>` rather than as
 * currentColor strokes.
 */
export function BodyIcon({ name, size = 48, className, style }: BodyIconProps) {
  return (
    <img
      src={SOURCES[name]}
      width={size}
      height={size}
      alt=''
      aria-hidden
      className={className}
      style={{ display: 'block', ...style }}
    />
  )
}
