import type { SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CFG: Record<SubmissionStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  opened: { label: "Opened", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
  submitted: { label: "Submitted", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border tracking-[0.06em] uppercase whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
        c.bg, c.text, c.border,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 ring-2 ring-white/60", c.dot)} />
      {c.label}
    </span>
  );
}
