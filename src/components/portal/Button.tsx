import { cn } from "@/lib/utils";
import { NAVY, GOLD, GOLD_DARK } from "@/lib/constants";

type Variant = "primary" | "gold" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "text-white border-transparent",
  gold: "text-white border-transparent",
  outline: "bg-white text-[#0B1F3A] border-[#0B1F3A]/12 hover:bg-[#F4F6FA]",
  ghost: "bg-transparent text-[#64748B] border-transparent hover:bg-[#F4F6FA]",
  danger: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", icon, className, children, style, ...props }: ButtonProps) {
  const gradient = variant === "gold"
    ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: `0 4px 14px ${GOLD}40` }
    : variant === "primary"
    ? { background: `linear-gradient(135deg, ${NAVY}, #162d52)`, boxShadow: `0 4px 14px ${NAVY}30` }
  : {};

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      style={{ ...gradient, ...style }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
