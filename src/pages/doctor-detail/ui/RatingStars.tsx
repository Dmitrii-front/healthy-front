import { Icon } from "@/shared/ui/Icon";

interface RatingStarsProps {
  rating: number;
  size?: number;
}

/**
 * Renders 5 stars with a coral fill proportional to `rating`. Uses CSS clip
 * trick — full layer behind, partial-fill layer overlay clipped to N%.
 */
export function RatingStars({ rating, size = 12 }: RatingStarsProps) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="relative inline-flex">
      <span className="flex gap-0.5 text-mist-graphite/70">
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} name="star" size={size} stroke={1.4} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-brick-coral"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} name="star" size={size} stroke={1.4} style={{ fill: "currentColor" }} />
        ))}
      </span>
    </span>
  );
}
