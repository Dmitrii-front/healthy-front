import { Icon, type IconName } from "@/shared/ui/Icon";

interface ConfirmLineProps {
  icon: IconName;
  label: string;
}

export function ConfirmLine({ icon, label }: ConfirmLineProps) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] text-soft-graphite">
      <Icon name={icon} size={15} stroke={1.7} className="text-distant-graphite" />
      <span>{label}</span>
    </div>
  );
}
