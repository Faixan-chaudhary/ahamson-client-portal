import { Check } from "lucide-react";
import { GOLD, GOLD_DARK } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Step { n: number; label: string; icon: React.FC<{ className?: string }> }

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  const pct = ((current - 1) / (steps.length - 1)) * 100;
  return (
    <div className="flex items-center justify-between mb-5 relative">
      <div className="absolute top-3.5 left-0 right-0 h-px bg-[#0B1F3A]/10 z-0" />
      <div className="absolute top-3.5 left-0 h-px z-0 transition-all duration-500" style={{ width: `${pct}%`, background: GOLD }} />
      {steps.map(s => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="relative z-10 flex flex-col items-center gap-1 flex-1">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
              done ? "border-transparent shadow-md" : active ? "border-[#F7931E] bg-white shadow-lg shadow-[#F7931E]/20" : "bg-white border-[#0B1F3A]/12")}
              style={done ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` } : {}}>
              {done ? <Check className="w-4 h-4 text-white" /> : <s.icon className={cn("w-3.5 h-3.5", active ? "text-[#F7931E]" : "text-[#94A3B8]")} />}
            </div>
            <span className={cn("text-[9px] font-bold uppercase tracking-wide text-center hidden sm:block max-w-[72px] leading-tight",
              active ? "text-[#0B1F3A]" : "text-[#94A3B8]")}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
