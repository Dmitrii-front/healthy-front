import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/Icon";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brick-coral text-card-white">
        <Icon name="monogram-h" size={17} stroke={2} />
      </div>
      <span className="text-[18px] font-medium tracking-tight text-graphite">Healthy</span>
    </div>
  );
}
