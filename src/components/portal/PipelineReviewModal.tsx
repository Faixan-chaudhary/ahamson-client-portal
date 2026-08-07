import { Modal } from "./Modal";
import { Button } from "./Button";
import type { PipelineEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  items: PipelineEntry[];
  loading?: boolean;
  onClose: () => void;
  onOpenEntry?: (entry: PipelineEntry) => void;
}

function money(value?: string) {
  if (!value) return "—";
  const num = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num)) return value;
  return `AED ${num.toLocaleString("en-US")}`;
}

export function PipelineReviewModal({ open, items, loading, onClose, onOpenEntry }: Props) {
  const totalValue = items.reduce((sum, row) => {
    const n = Number(String(row.valueAed || "0").replace(/,/g, ""));
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Pipeline Review"
      subtitle="Open deals for manager presentation — Lost excluded"
    >
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#F7931E]/12 text-[#C46A0A] border border-[#F7931E]/20 px-2.5 py-1 font-semibold">
            {items.length} open entries
          </span>
          <span className="rounded-full bg-[#F4F6FA] text-[#64748B] border border-[#0B1F3A]/8 px-2.5 py-1 font-semibold">
            Pipeline value {money(String(totalValue))}
          </span>
        </div>

        {loading && <p className="text-sm text-[#64748B] py-6 text-center">Loading review pack…</p>}
        {!loading && !items.length && (
          <p className="text-sm text-[#94A3B8] py-6 text-center">No open pipeline entries to review.</p>
        )}

        <div className="space-y-2">
          {items.map(row => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpenEntry?.(row)}
              className="w-full text-left rounded-xl border border-[#0B1F3A]/8 bg-white hover:border-[#F7931E]/40 hover:bg-[#FFFBF5] px-3 py-2.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B1F3A] truncate">
                    {row.partner || "—"} · {row.endUser || "No end user"}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                    {row.brand || "—"} · {row.product || "—"}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2 py-0.5 flex-shrink-0",
                  row.status?.toLowerCase() === "won" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  row.status?.toLowerCase() === "quoted" && "bg-sky-50 text-sky-700 border-sky-200",
                  row.status?.toLowerCase() === "on hold" && "bg-violet-50 text-violet-700 border-violet-200",
                  !["won", "quoted", "on hold"].includes((row.status || "").toLowerCase()) && "bg-[#F4F6FA] text-[#64748B] border-[#0B1F3A]/10",
                )}>
                  {row.status || "—"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#94A3B8]">
                <span>SP {row.sp || "—"}</span>
                <span>{money(row.valueAed)}</span>
                <span>GP {money(row.gpAed)}</span>
                <span>{row.probability || "—"}</span>
                <span>{row.closure || "—"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#0B1F3A]/8">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
