import { cn } from "@/shared/lib/cn";

type Status = "confirmed" | "pending" | "cancelled" | "completed";

const STATUS_LABELS: Record<Status, string> = {
  confirmed: "ПОДТВЕРЖДЕНО",
  pending: "ОЖИДАЕТ",
  cancelled: "ОТМЕНЕНО",
  completed: "ЗАВЕРШЕНО",
};

const STATUS_STYLES: Record<Status, string> = {
  confirmed: "text-confirmed-sage",
  pending: "text-pending-amber-deep",
  cancelled: "text-distant-graphite",
  completed: "text-distant-graphite",
};

interface StatusEyebrowProps {
  status: Status;
  className?: string;
}

export function StatusEyebrow({ status, className }: StatusEyebrowProps) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.14em]",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
