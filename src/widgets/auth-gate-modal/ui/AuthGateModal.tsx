import { useEffect } from 'react'

import { BrandMark } from '@/shared/ui/BrandMark'

/**
 * Full-screen gate shown when the user lands inside the SPA without a valid
 * session. The SPA is protected — auth (sign-in / sign-up / forgot-password /
 * verify-email / reset-password) lives on the Astro marketing site at the
 * browser root. The gate keeps the user inside the Healthy brand context
 * (instead of a hard cross-document redirect that flashes a different page)
 * and offers two explicit CTAs into the SEO zone.
 *
 * Backdrop blurs the underlying SPA so a) it stays brand-warm rather than
 * exposing whatever partial state managed to render, and b) prevents any
 * stray interaction with the un-authed shell.
 */
export function AuthGateModal() {
  // Lock body scroll while the gate is visible. Restored on unmount in case
  // a successful refresh later flips `isAuthenticated` back to true.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Auth flow lives in the landing-page modal on Astro (web/components/auth/
  // LoginModal.astro). It auto-opens when `?auth=sign-in` or `?auth=sign-up`
  // is present and reads `?return_to=` to bounce back after success.
  const goToAuth = (mode: 'sign-in' | 'sign-up') => {
    const returnTo = encodeURIComponent(window.location.href)
    window.location.assign(`/?auth=${mode}&return_to=${returnTo}`)
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='auth-gate-title'
      aria-describedby='auth-gate-subtitle'
      className='fixed inset-0 z-50 flex items-center justify-center px-6 py-10'
    >
      {/* Backdrop — warm paper tint + blur, blocks pointer events on the SPA shell */}
      <div aria-hidden className='bg-warm-paper/85 absolute inset-0 backdrop-blur-md' />

      <div className='bg-card-white relative z-10 flex w-full max-w-[420px] flex-col items-center gap-7 rounded-[24px] border border-black/5 px-7 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)] md:px-9 md:py-10'>
        <BrandMark />

        <div className='flex flex-col gap-2 text-center'>
          <h1
            id='auth-gate-title'
            className='text-graphite text-[24px] leading-[1.15] font-semibold tracking-[-0.02em]'
          >
            Войдите в аккаунт
          </h1>
          <p id='auth-gate-subtitle' className='text-distant-graphite text-[15px] leading-[1.45]'>
            Чтобы продолжить работу с Healthy, войдите или создайте аккаунт за минуту.
          </p>
        </div>

        <div className='flex w-full flex-col gap-3'>
          <button
            type='button'
            onClick={() => goToAuth('sign-in')}
            className='rounded-pill bg-clinic-teal text-card-white hover:bg-brick-teal inline-flex h-[52px] w-full items-center justify-center text-[15px] font-semibold shadow-[0_1px_2px_rgba(14,124,140,0.2),0_8px_20px_rgba(14,124,140,0.2)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(14,124,140,0.25),0_12px_28px_rgba(14,124,140,0.28)] active:scale-[0.985]'
          >
            Войти
          </button>
          <button
            type='button'
            onClick={() => goToAuth('sign-up')}
            className='rounded-pill text-graphite hover:bg-warm-paper inline-flex h-[52px] w-full items-center justify-center border border-black/10 bg-transparent text-[15px] font-semibold transition-colors duration-150'
          >
            Зарегистрироваться
          </button>
        </div>

        <p className='text-distant-graphite/85 text-center text-[12px] leading-[1.4]'>
          Эта страница доступна только авторизованным пользователям.
        </p>
      </div>
    </div>
  )
}
