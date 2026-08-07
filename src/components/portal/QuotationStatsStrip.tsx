import { CheckCircle2, CircleDot, ClipboardList, FileWarning, Layers3, Scale, Timer, Workflow } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { NAVY } from "@/lib/constants";
import type { QuotationStats } from "@/lib/api";
import type { QuotationQueueKey } from "@/lib/quotation-status";

type Props = {
  stats?: QuotationStats | null;
  activeQueue?: QuotationQueueKey | "";
  onSelectQueue?: (queue: QuotationQueueKey | "") => void;
  role?: string | null;
};

export function QuotationStatsStrip({ stats, activeQueue = "", onSelectQueue, role }: Props) {
  const s = stats ?? {
    total: 0,
    open: 0,
    submitted: 0,
    lost: 0,
    closed: 0,
    pendingFinance: 0,
    pendingSalesHead: 0,
    pendingSales: 0,
    myQueue: 0,
  };

  const isApprover = role === "finance_manager" || role === "sales_head" || role === "admin";
  const isSales = role === "manager" || role === "admin" || role === "sales_head";

  function select(queue: QuotationQueueKey | "") {
    if (!onSelectQueue) return;
    onSelectQueue(activeQueue === queue ? "" : queue);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiCard
          label="My Action Queue"
          value={s.myQueue ?? 0}
          sub="Needs your next step"
          icon={ClipboardList}
          accent="#C46A0A"
          trend="neutral"
          active={activeQueue === "action"}
          onClick={() => select("action")}
        />
        {(isApprover || role === "manager") && (
          <KpiCard
            label="Finance Queue"
            value={s.pendingFinance}
            sub="Awaiting FM approval"
            icon={Scale}
            accent="#F59E0B"
            trend="neutral"
            active={activeQueue === "finance"}
            onClick={() => select("finance")}
          />
        )}
        {(isApprover || role === "manager") && (
          <KpiCard
            label="Sales Head Queue"
            value={s.pendingSalesHead}
            sub="OEM order approval"
            icon={Timer}
            accent="#F7931E"
            trend="neutral"
            active={activeQueue === "sales_head"}
            onClick={() => select("sales_head")}
          />
        )}
        {isSales && (
          <KpiCard
            label="Sales Next Steps"
            value={s.pendingSales ?? 0}
            sub="Sales workflow items"
            icon={Workflow}
            accent="#0EA5E9"
            trend="neutral"
            active={activeQueue === "sales"}
            onClick={() => select("sales")}
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiCard
          label="Total Quotes"
          value={s.total}
          sub="All phases"
          icon={Layers3}
          accent={NAVY}
          trend="neutral"
          active={activeQueue === ""}
          onClick={() => onSelectQueue?.("")}
        />
        <KpiCard label="Open" value={s.open} sub="In progress" icon={CircleDot} accent="#0EA5E9" trend="neutral" />
        <KpiCard label="Submitted" value={s.submitted} sub="Sent / placed" icon={CheckCircle2} accent="#10B981" trend="up" />
        <KpiCard label="Lost" value={s.lost} sub="Closed lost" icon={FileWarning} accent="#EF4444" trend="neutral" />
      </div>

      {!!stats?.byStatus?.length && (
        <div className="flex flex-wrap gap-1.5">
          {stats.byStatus.slice(0, 10).map(row => (
            <span
              key={row.status}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0B1F3A]/10 bg-white px-2.5 py-1 text-[11px] text-[#0B1F3A]"
              title={row.status}
            >
              <span className="font-semibold truncate max-w-[180px]">{row.status}</span>
              <span className="font-bold text-[#C46A0A]">{row.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
