import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

export function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(t); onExpired?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpired]);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const isLow = seconds < 600;

  return (
    <div className={cn(
      "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold",
      isLow ? "border-red-400/40 bg-red-500/15 text-red-300" : "border-[#F7931E]/30 bg-[#F7931E]/15 text-[#F7931E]",
    )}>
      <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="whitespace-nowrap">
        <span className="hidden sm:inline">Link expires in </span>
        <span className="font-['JetBrains_Mono'] tabular-nums">{hh}:{mm}:{ss}</span>
      </span>
    </div>
  );
}
