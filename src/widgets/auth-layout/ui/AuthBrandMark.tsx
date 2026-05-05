interface AuthBrandMarkProps {
  /** "ink" (default) for light surfaces; "light" for the dark desktop top bar. */
  tone?: "ink" | "light";
}

/**
 * Teal-themed brand mark for the auth flow. Mirrors the design 1:1
 * (36×36 rounded-10 tile, plain bold "H", "Healthy" wordmark).
 * Two tones: ink wordmark for the light mobile column / desktop card
 * surface, white wordmark for the dark desktop top bar.
 *
 * Distinct from the main `BrandMark` (which uses brick-coral + the
 * monogram-h icon) so we can pivot auth to teal without touching the rest
 * of the app's brand surface.
 */
export function AuthBrandMark({ tone = "ink" }: AuthBrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-teal-brand text-[18px] leading-none font-bold text-white">
        H
      </div>
      <span
        className={`text-[18px] font-bold ${tone === "light" ? "text-white" : "text-auth-ink"}`}
      >
        Healthy
      </span>
    </div>
  );
}
