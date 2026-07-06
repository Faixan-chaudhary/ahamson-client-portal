import { cn } from "@/lib/utils";
import { GOLD } from "@/lib/constants";

const LOGO_SRC = "/logos/ahamsonwhitelogo.svg";

/** Gold italic accent for the word "Portal" — same family as headings for a cohesive look. */
export function PortalWord({
  className,
  children = "Portal",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn("font-portal-accent inline-block align-baseline", className)}
      style={{ color: GOLD }}
    >
      {children}
    </span>
  );
}

export function Logo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" }) {
  const height = size === "md" ? 30 : 24;

  return (
    <img
      src={LOGO_SRC}
      alt="Ahamson Client Document Portal"
      className={cn(
        "w-auto max-w-full object-contain object-left",
        !light && "brightness-0 opacity-85",
      )}
      style={{ height }}
      draggable={false}
    />
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-[#0B1F3A]/8 px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20 gap-4 flex-wrap shadow-[0_1px_3px_rgba(11,31,58,0.04)]">
      <div>
        <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#0B1F3A]">{title}</h1>
        {subtitle && <p className="text-[#94A3B8] text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
