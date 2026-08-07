import { ArrowUpRight, Minus } from "lucide-react";
import { NAVY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function KpiCard({ label, value, sub, icon: Icon, accent, trend, onClick, active }: {
  label: string; value: number | string; sub: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  accent: string; trend?: "up" | "neutral";
  onClick?: () => void;
  active?: boolean;
}) {
  const interactive = typeof onClick === "function";
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 portal-panel relative overflow-hidden text-left w-full",
        interactive && "portal-panel-hover cursor-pointer",
        active ? "border-[#C46A0A] ring-2 ring-[#C46A0A]/20" : "border-[#0B1F3A]/8",
      )}
    >
      <div className="absolute top-0 right-0 w-20 sm:w-28 h-20 sm:h-28 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-[0.04]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
        <p className="text-[#64748B] text-xs sm:text-sm font-medium leading-snug">{label}</p>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="font-['Playfair_Display'] text-[24px] sm:text-[30px] font-bold leading-none mb-1" style={{ color: NAVY }}>{value}</p>
      <div className="flex items-center gap-1.5">
        {trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
        {trend === "neutral" && <Minus className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />}
        <p className="text-[#64748B] text-[11px] sm:text-xs truncate leading-tight">{sub}</p>
      </div>
    </Comp>
  );
}
