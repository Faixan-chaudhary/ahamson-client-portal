import { Copy, Check } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";
import { NAVY } from "@/lib/constants";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { AnimatedIconSwap } from "./AnimatedIconSwap";

interface CopyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  text: string;
  variant?: "labeled" | "icon";
  appearance?: "soft" | "solid";
  label?: string;
  copiedLabel?: string;
  resetMs?: number;
}

export function CopyButton({
  text,
  variant = "labeled",
  appearance = "soft",
  label = "Copy",
  copiedLabel = "Copied",
  resetMs = 2000,
  className,
  style,
  ...props
}: CopyButtonProps) {
  const { active: copied, trigger } = useActionFeedback(resetMs);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) trigger();
  }

  const iconSwap = (
    <AnimatedIconSwap
      active={copied}
      size={variant === "icon" ? "w-4 h-4" : "w-3.5 h-3.5"}
      idle={<Copy className="w-full h-full" />}
      activeIcon={<Check className="w-full h-full" strokeWidth={2.5} />}
    />
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy link"}
        aria-label={copied ? "Copied" : "Copy link"}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
          copied
            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
            : "text-[#64748B] hover:bg-[#F4F6FA] hover:text-[#0B1F3A]",
          className,
        )}
        {...props}
      >
        {iconSwap}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-300 border",
        appearance === "solid"
          ? copied
            ? "px-3 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
            : "px-3 py-1.5 text-white border-transparent"
          : copied
            ? "px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
            : "px-2.5 py-1 text-[#0B1F3A] bg-[#F4F6FA] hover:bg-[#EEF1F7] border-transparent text-xs",
        className,
      )}
      style={
        appearance === "solid" && !copied
          ? { background: `linear-gradient(135deg, ${NAVY}, #162d52)`, boxShadow: `0 4px 14px ${NAVY}30`, ...style }
          : style
      }
      {...props}
    >
      {iconSwap}
      <span className="transition-colors duration-300">{copied ? copiedLabel : label}</span>
    </button>
  );
}
