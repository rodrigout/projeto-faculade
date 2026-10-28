import { cn } from "@/lib/utils";
import { STATUS_LABEL, type BoxStatus } from "@/data/mock";

const styles: Record<BoxStatus, string> = {
  vazio: "bg-muted text-muted-foreground border-border",
  ocupado: "bg-primary/15 text-primary border-primary/40",
};

export function StatusBadge({ status, className }: { status: BoxStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider",
        styles[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
