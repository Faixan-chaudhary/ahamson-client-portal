import { ArrowUpRight, Minus } from "lucide-react";
import { NAVY } from "@/lib/constants";

export function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: number | string; sub: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  accent: string; trend?: "up" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 p-5 portal-panel portal-panel-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 opacity-[0.04]" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[#64748B] text-sm font-medium">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
      <p className="font-['Playfair_Display'] text-[36px] font-bold leading-none mb-2" style={{ color: NAVY }}>{value}</p>
      <div className="flex items-center gap-1.5">
        {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
        {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />}
        <p className="text-[#64748B] text-xs">{sub}</p>
      </div>
    </div>
  );
}
