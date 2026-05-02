import { Icon, type IconName } from "@/shared/ui/Icon";

export interface SettingsItem {
  icon: IconName;
  label: string;
  meta?: string;
  onClick?: () => void;
}

interface SettingsListProps {
  items: SettingsItem[];
}

export function SettingsList({ items }: SettingsListProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-card-white">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <button
            key={it.label}
            type="button"
            onClick={it.onClick}
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-transform active:scale-[0.992] ${
              last ? "" : "border-b border-hairline"
            }`}
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-linen-shade text-soft-graphite">
              <Icon name={it.icon} size={15} stroke={1.8} />
            </span>
            <span className="flex-1 text-[14px] text-graphite">{it.label}</span>
            {it.meta && <span className="text-[12.5px] text-distant-graphite">{it.meta}</span>}
            <Icon name="chevron-right" size={15} className="text-distant-graphite" />
          </button>
        );
      })}
    </div>
  );
}
