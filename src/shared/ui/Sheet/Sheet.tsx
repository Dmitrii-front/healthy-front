import { useEffect, type ReactNode } from "react";
import { Icon } from "@/shared/ui/Icon";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom-sheet modal. Renders fixed-position backdrop + slide-up panel.
 * Closes on backdrop tap, Escape key, or close-button.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute inset-0 bg-graphite/40 backdrop-blur-[2px]"
      />
      <div
        className="relative flex max-h-[85dvh] w-full flex-col rounded-t-[24px] bg-card-white shadow-[0_-12px_40px_-8px_rgb(0_0_0/0.18)]"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          {title && (
            <h2 className="m-0 text-[18px] font-medium tracking-[-0.012em] text-graphite">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 ml-auto grid h-9 w-9 place-items-center rounded-full text-soft-graphite"
          >
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
