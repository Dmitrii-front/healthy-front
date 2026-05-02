import { Link } from "@tanstack/react-router";
import { Icon } from "@/shared/ui/Icon";

/**
 * Floating frosted search shortcut. Sits ~84px above the bottom edge so it
 * clears the tab bar with breathing room. Tap → /search.
 */
export function SearchLauncher() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[25] px-4">
      <Link
        to="/search"
        className="pointer-events-auto flex w-full items-center gap-2.5 rounded-2xl border border-graphite/10 bg-card-white/90 px-3.5 py-3.5 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_12px_28px_-8px_rgb(0_0_0/0.18),0_4px_10px_-2px_rgb(0_0_0/0.08)]"
      >
        <Icon name="search" size={17} stroke={1.8} className="shrink-0 text-distant-graphite" />
        <span className="flex-1 text-left text-[14px] text-distant-graphite">
          Поиск докторов, специальностей
        </span>
        <Icon
          name="chevron-right"
          size={15}
          stroke={2}
          className="shrink-0 text-distant-graphite/70"
        />
      </Link>
    </div>
  );
}
