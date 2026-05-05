import type { CSSProperties, ReactNode } from "react";
import { AuthBrandMark } from "./AuthBrandMark";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Mobile-only footer slot (eyebrow + alt CTA pill, pinned to bottom).
   *  On desktop the alt action lives inline inside the card via children
   *  (`hidden lg:block` line at the end of the form), per design. */
  footer?: ReactNode;
}

/**
 * Auth chrome — teal pivot, two distinct registers per viewport.
 *
 * Mobile (< lg): full-height warm column on `#FAF8F5` with a subtle
 * teal-tint gradient at the top. Brand mark sits at the top of the
 * column; alt-action footer pinned to the bottom of the viewport.
 *
 * Desktop (lg+): dramatic dark backdrop (#051116 → #0A1F25 with three
 * radial teal glows + SVG noise) carrying a centered floating warm
 * card (460×auto, blur-backed, soft shadow). Brand mark + support phone
 * sit in a top bar over the backdrop; testimonial + stats anchor the
 * bottom corners. Alt-action collapses to an inline link inside the card.
 *
 * Variant D shell-persistence: `view-transition-name`s on the backdrop
 * and brand-mark keep them out of the swapping `root` group.
 *
 * Entrance animation lives on the INNER `.auth-reveal` block (title +
 * subtitle + form) — brand-mark and footer stay put. Transform-only,
 * timed to match the VT pseudo so there's no visual jump when VT ends
 * and the live DOM is exposed.
 */
export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh bg-auth-bg pt-[env(safe-area-inset-top)] font-auth lg:bg-auth-shell-dark lg:pt-0">
      {/* Backdrop — mobile teal tint OR desktop dark glow stack. The
          background switch lives on the .auth-bg-stack class via media
          query (not inline), so the inline view-transition-name doesn't
          collide with the higher-specificity inline `background` rule. */}
      <div
        aria-hidden
        className="auth-bg-stack pointer-events-none absolute inset-0"
        style={{ viewTransitionName: "auth-bg" } as CSSProperties}
      />

      {/* Desktop SVG noise overlay — gives the dark backdrop tactile grain. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-[0.35] mix-blend-overlay lg:block"
      >
        <filter id="auth-noise">
          <feTurbulence baseFrequency="0.9" numOctaves="2" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-noise)" />
      </svg>

      {/* Desktop top bar — brand left, support phone right. */}
      <header className="absolute inset-x-0 top-0 z-10 hidden items-center justify-between px-12 py-8 lg:flex">
        <div style={{ viewTransitionName: "auth-brand" } as CSSProperties}>
          <AuthBrandMark tone="light" />
        </div>
        <div className="text-[13px] text-white/65">Поддержка · +7 800 000 00 00</div>
      </header>

      {/* Content stage — mobile: full column. Desktop: centered grid cell. */}
      <div className="relative grid min-h-dvh place-items-stretch lg:place-items-center">
        {/*
          Card surface (lg+). NOTE: deliberately no `backdrop-filter` here.
          backdrop-blur on a captured root element breaks View Transitions
          snapshots in Chromium — the card renders as an empty rectangle
          mid-transition (verified via screen recording). The 97% opaque
          bg gives essentially the same visual result without the bug.
        */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pt-6 pb-8 md:pt-10 lg:m-0 lg:min-h-0 lg:w-[460px] lg:max-w-[460px] lg:rounded-[24px] lg:border lg:border-white/40 lg:bg-[rgba(255,253,250,0.97)] lg:p-10 lg:shadow-[0_30px_80px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.04)]">
          {/* Mobile-only brand mark inside the column — kept OUTSIDE
              .auth-reveal so it stays put when content slides in. */}
          <div className="lg:hidden" style={{ viewTransitionName: "auth-brand" } as CSSProperties}>
            <AuthBrandMark />
          </div>

          {/* Reveal-on-mount block — only the swapping content slides.
              Transform-only animation (no opacity) keeps it visible
              throughout, eliminating the «page disappears» perception
              on devices without View Transitions API support. */}
          <div className="auth-reveal flex flex-col">
            <h1 className="mt-9 mb-2 text-[34px] leading-[1.1] font-bold tracking-[-0.025em] text-auth-ink lg:mt-0 lg:text-[30px] lg:leading-[1.15] lg:tracking-[-0.02em]">
              {title}
            </h1>
            <p className="text-[16px] text-auth-muted lg:text-[14px]">{subtitle}</p>
            <div className="mt-8 flex flex-col gap-[18px] lg:mt-7 lg:gap-4">{children}</div>
          </div>

          {footer && <div className="mt-auto flex flex-col gap-3.5 pt-12 lg:hidden">{footer}</div>}
        </div>
      </div>

      {/* Desktop bottom-left — testimonial pull-quote. */}
      <aside className="absolute bottom-9 left-12 z-10 hidden max-w-[320px] text-white/85 lg:block">
        <p className="text-[13px] leading-[1.55]">
          «Записалась к врачу за 40 секунд. Слот через час, всё подтверждено.»
        </p>
        <p className="mt-2.5 text-[12px] opacity-70">— Мария К., пациент Healthy</p>
      </aside>

      {/* Desktop bottom-right — credibility stats. */}
      <aside className="absolute right-12 bottom-9 z-10 hidden gap-6 text-[12px] text-white/55 lg:flex">
        <span>2 800+ врачей</span>
        <span>50 000+ записей в месяц</span>
        <span>4.9 ★</span>
      </aside>
    </div>
  );
}
