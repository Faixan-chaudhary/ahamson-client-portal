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
      alt="AHamson Client Document Portal"
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
    <div className="sticky top-0 z-20">
      <div className="px-3 sm:px-6 lg:px-9 xl:px-12">
        <header
          className="mx-auto max-w-[1200px] flex items-center justify-between gap-3 sm:gap-4 flex-wrap rounded-b-[16px] sm:rounded-b-[20px] px-3.5 sm:px-5 lg:px-6 py-3 sm:py-3.5 border border-[#06142A]/30 border-t-0 shadow-[0_12px_32px_-16px_rgba(6,20,42,0.48)]"
          style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #132d52 100%)" }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-[17px] lg:text-lg font-semibold tracking-tight text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-white/55 text-[11px] sm:text-xs mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children && (
            <div className="flex-shrink-0 w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
              {children}
            </div>
          )}
        </header>
      </div>
    </div>
  );
}
