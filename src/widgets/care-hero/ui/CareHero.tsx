import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";

/**
 * Empty-state hero card. Heart pulses + ECG trace draws-and-erases on a
 * coral-warm radial wash. Animations respect `prefers-reduced-motion`.
 */
export function CareHero() {
  const navigate = useNavigate();
  return (
    <div
      className="relative w-full overflow-hidden rounded-[22px] border border-hairline px-5 py-7 text-graphite"
      style={{
        background:
          "radial-gradient(140% 100% at 80% 10%, color-mix(in oklch, var(--color-tinted-linen) 90%, var(--color-card-white)) 0%, var(--color-card-white) 65%)",
      }}
    >
      <style>{`
        @keyframes ch-heart-pulse {
          0%, 100% { transform: scale(1); }
          14%      { transform: scale(1.06); }
          28%      { transform: scale(1.0); }
          42%      { transform: scale(1.03); }
          60%      { transform: scale(1.0); }
        }
        @keyframes ch-ecg-trace {
          0%   { stroke-dasharray: 0 1200;    stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 1200 1200; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 1200 1200; stroke-dashoffset: -1200; }
        }
        .ch-heart-pulse { animation: ch-heart-pulse 1.6s ease-in-out infinite; transform-origin: 52px 46px; }
        .ch-ecg-trace { animation: ch-ecg-trace 1.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ch-heart-pulse, .ch-ecg-trace { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-[18px] h-[84px] w-[104px]"
      >
        <svg
          viewBox="0 0 104 84"
          width="104"
          height="84"
          aria-hidden
          style={{ overflow: "visible", display: "block" }}
        >
          <g className="ch-heart-pulse">
            <path
              transform="translate(10 0) scale(3.5)"
              d="M12 21s-7.5-4.6-9.6-9.4C1.1 8 3 4.5 6.4 4.1c2.2-.3 4.2.9 5.6 2.7 1.4-1.8 3.4-3 5.6-2.7 3.4.4 5.3 3.9 4 7.5C19.5 16.4 12 21 12 21Z"
              fill="oklch(56% 0.13 25)"
            />
          </g>
          {/* Dark outline for crisp edge on coral */}
          <path
            d="M -6 50 L 30 50 L 36 46 L 40 54 L 44 50 L 50 50 L 54 56 L 58 22 L 62 70 L 66 50 L 72 50 L 76 46 L 80 54 L 84 50 L 110 50"
            stroke="color-mix(in oklch, var(--color-brick-coral) 65%, black)"
            strokeWidth="4.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1200"
            className="ch-ecg-trace"
            style={{ opacity: 0.45 }}
          />
          {/* White core */}
          <path
            d="M -6 50 L 30 50 L 36 46 L 40 54 L 44 50 L 50 50 L 54 56 L 58 22 L 62 70 L 66 50 L 72 50 L 76 46 L 80 54 L 84 50 L 110 50"
            stroke="white"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1200"
            className="ch-ecg-trace"
          />
        </svg>
      </div>

      <div className="relative z-[1] w-full">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-brick-coral">
          Забота рядом
        </p>
        <h2 className="m-0 max-w-[248px] text-[28px] font-medium leading-[1.12] tracking-[-0.02em] text-graphite text-pretty">
          Доктор рядом, когда нужен.
        </h2>
        <p className="mt-3 mb-6 max-w-[300px] text-[14px] leading-relaxed text-soft-graphite text-pretty">
          Подберём доктора и запишем на удобное время без лишних звонков.
        </p>
        <Button onClick={() => void navigate({ to: "/search" })} full className="justify-between">
          Записаться на приём
          <Icon name="chevron-right" size={14} stroke={2.2} />
        </Button>
      </div>
    </div>
  );
}
