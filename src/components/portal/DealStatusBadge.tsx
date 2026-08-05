import { CheckCircle2, Clock3, XCircle, Eye } from "lucide-react";
import type { DealStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEAL_STATUS_CFG: Record<string, { label: string; bg: string; text: string; border: string; Icon: typeof Clock3 }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", Icon: Clock3 },
  opened: { label: "Opened", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", Icon: Eye },
  approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", Icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", Icon: XCircle },
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", Icon: XCircle },
};

export function DealStatusBadge({ status }: { status: DealStatus | string }) {
  const c = DEAL_STATUS_CFG[status] ?? DEAL_STATUS_CFG.pending;
  const Icon = c.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border tracking-[0.06em] uppercase whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
        c.bg, c.text, c.border,
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2.25} />
      {c.label}
    </span>
  );
}
