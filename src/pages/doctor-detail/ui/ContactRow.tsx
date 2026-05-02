import { Icon, type IconName } from "@/shared/ui/Icon";

interface ContactRowProps {
  icon: IconName;
  label: string;
}

export function ContactRow({ icon, label }: ContactRowProps) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] text-soft-graphite">
      <Icon name={icon} size={14} stroke={1.6} className="text-distant-graphite" />
      {label}
    </div>
  );
}
