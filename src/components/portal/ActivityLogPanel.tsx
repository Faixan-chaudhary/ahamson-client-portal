import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityLogItem {
  action: string;
  detail?: string;
  by?: string;
  role?: string;
  at?: string;
}

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortLogs(logs: ActivityLogItem[]) {
  return [...logs].sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
}

interface Props {
  logs?: ActivityLogItem[] | null;
  className?: string;
  /** Max height for the scroll area (compact by default). */
  maxHeightClass?: string;
}

/** Compact activity timeline for view popups. */
export function ActivityLogPanel({
  logs,
  className,
  maxHeightClass = "max-h-40",
}: Props) {
  const items = sortLogs(logs ?? []);

  return (
    <div className={cn("rounded-xl border border-[#0B1F3A]/10 bg-[#F8F9FC]/70 overflow-hidden", className)}>
      <div className="px-2.5 py-1.5 border-b border-[#0B1F3A]/8 flex items-center gap-1.5">
        <Clock3 className="w-3.5 h-3.5 text-[#F7931E] flex-shrink-0" />
        <p className="text-xs font-semibold text-[#0B1F3A]">Activity log</p>
        {items.length > 0 && (
          <span className="ml-auto text-[10px] font-bold text-[#C46A0A] bg-[#F7931E]/12 rounded-full px-1.5 py-0.5">
            {items.length}
          </span>
        )}
      </div>
      <div className={cn("px-2.5 py-2 overflow-y-auto scrollbar-thin", maxHeightClass)}>
        {!items.length && (
          <p className="text-[11px] text-[#94A3B8] py-0.5">No activity logged yet.</p>
        )}
        <ol className="space-y-0">
          {items.map((log, i) => (
            <li key={`${log.at}-${i}`} className="relative flex gap-2 pb-2 last:pb-0">
              <div className="flex flex-col items-center pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F7931E] flex-shrink-0" />
                {i < items.length - 1 && <span className="w-px flex-1 bg-[#0B1F3A]/10 mt-1" />}
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-[#0B1F3A]/8 bg-white px-2 py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#0B1F3A] truncate">{log.action || "Action"}</p>
                  <p className="text-[9px] text-[#94A3B8] whitespace-nowrap flex-shrink-0">{formatWhen(log.at)}</p>
                </div>
                {log.detail ? (
                  <p className="text-[10px] text-[#64748B] mt-0.5 line-clamp-2 whitespace-pre-wrap break-words">
                    {log.detail}
                  </p>
                ) : null}
                <p className="text-[9px] text-[#94A3B8] mt-0.5">
                  {log.by ? `By ${log.by}` : "By system"}
                  {log.role ? ` · ${log.role.replace(/_/g, " ")}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
