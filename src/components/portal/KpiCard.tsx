import { ArrowUpRight, Minus } from "lucide-react";
import { NAVY } from "@/lib/constants";

export function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: number | string; sub: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  accent: string; trend?: "up" | "neutral";
}) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#0B1F3A]/8 p-3.5 sm:p-5 portal-panel portal-panel-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 rounded-full -translate-y-10 sm:-translate-y-12 translate-x-10 sm:translate-x-12 opacity-[0.04]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <p className="text-[#64748B] text-xs sm:text-sm font-medium leading-snug">{label}</p>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
        </div>
      </div>
      <p className="font-['Playfair_Display'] text-[28px] sm:text-[36px] font-bold leading-none mb-1.5 sm:mb-2" style={{ color: NAVY }}>{value}</p>
      <div className="flex items-center gap-1.5">
        {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
        {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />}
        <p className="text-[#64748B] text-[11px] sm:text-xs truncate">{sub}</p>
      </div>
    </div>
  );
}
