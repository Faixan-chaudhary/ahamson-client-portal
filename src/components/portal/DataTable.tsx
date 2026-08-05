import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOLD } from "@/lib/constants";

export function DataTableCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#0B1F3A]/[0.07] overflow-hidden",
        "shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_28px_-10px_rgba(11,31,58,0.12)]",
        "ring-1 ring-[#0B1F3A]/[0.03]",
        className,
      )}
    >
      <div
        className="h-[2px] flex-shrink-0"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${GOLD} 35%, ${GOLD} 65%, transparent 95%)` }}
      />
      {children}
    </div>
  );
}

export function DataTableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 lg:px-6 py-3.5 sm:py-4 border-b border-[#0B1F3A]/[0.06]",
        "bg-gradient-to-b from-[#FAFBFD] to-white",
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTableTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F3A]/[0.06] to-[#0B1F3A]/[0.02] border border-[#0B1F3A]/[0.06] flex items-center justify-center flex-shrink-0 text-[#0B1F3A]/70">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="font-['Playfair_Display'] font-bold text-[#0B1F3A] leading-tight text-[15px] sm:text-[17px] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[#94A3B8] text-[11px] sm:text-xs mt-0.5 font-medium tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function DataTableFilters({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 w-full lg:w-auto", className)}>
      {children}
    </div>
  );
}

/** Fixed-height search with icon centered via inset-y flex (never drifts). */
export function DataTableSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-9 flex-1 basis-full min-w-0 sm:basis-auto lg:w-56 lg:flex-none",
        "rounded-xl border border-[#0B1F3A]/[0.1] bg-white/80 backdrop-blur-sm",
        "shadow-[inset_0_1px_2px_rgba(11,31,58,0.03)]",
        "focus-within:ring-2 focus-within:ring-[#F7931E]/25 focus-within:border-[#F7931E]/70 transition-all",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center text-[#94A3B8]">
        <Search className="size-3.5" strokeWidth={2} />
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="absolute inset-0 w-full rounded-xl bg-transparent pl-9 pr-3 text-[13px] text-[#0B1F3A] placeholder:text-[#94A3B8]/80 outline-none"
      />
    </div>
  );
}

export function DataTableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <table className={cn("w-full min-w-[720px] text-[13px] border-separate border-spacing-0", className)}>
      {children}
    </table>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function DataTableHeadRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="text-[#475569] text-[10px] uppercase tracking-[0.11em]">
      {children}
    </tr>
  );
}

export function DataTableTh({
  children,
  className,
  align = "left",
  sticky,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sticky?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "font-semibold bg-[#F7F8FB]/95 backdrop-blur-md whitespace-nowrap sticky top-0 z-[2]",
        "border-b border-[#0B1F3A]/[0.08] py-2 sm:py-2.5 px-3 sm:px-4",
        "first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6",
        "shadow-[0_1px_0_0_rgba(247,147,30,0.35)]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        sticky === "left" && "sticky left-0 z-10 shadow-[4px_0_12px_-6px_rgba(11,31,58,0.14)]",
        sticky === "right" && "sticky right-0 z-10 shadow-[-4px_0_12px_-6px_rgba(11,31,58,0.14)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&>tr:nth-child(even)]:bg-[#F9FAFC]/70">{children}</tbody>;
}

export function DataTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "group transition-colors duration-150",
        "border-b border-[#0B1F3A]/[0.045] last:border-0",
        "hover:bg-[#FFF8F0]/80",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableTd({
  children,
  className,
  variant = "default",
  align = "left",
  sticky,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "primary" | "muted";
  align?: "left" | "right" | "center";
  sticky?: "left" | "right";
}) {
  const variantClass = {
    default: "text-[#5B6B7C] font-medium",
    primary: "font-semibold text-[#0B1F3A] tracking-tight",
    muted: "text-[#94A3B8] text-xs tabular-nums whitespace-nowrap font-medium",
  }[variant];

  return (
    <td
      className={cn(
        "px-3 sm:px-4 py-1.5 sm:py-2 align-middle",
        "first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6",
        "first:border-l-2 first:border-transparent group-hover:first:border-[#F7931E]/70 transition-[border-color] duration-150",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        sticky === "left" && "sticky left-0 z-[1] bg-white group-hover:bg-[#FFF8F0] shadow-[4px_0_12px_-6px_rgba(11,31,58,0.1)]",
        sticky === "right" && "sticky right-0 z-[1] bg-white group-hover:bg-[#FFF8F0] shadow-[-4px_0_12px_-6px_rgba(11,31,58,0.1)]",
        variantClass,
        className,
      )}
    >
      {children}
    </td>
  );
}

export function DataTableState({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center">
        <div className="inline-flex flex-col items-center gap-1.5">
          <span className="text-[#94A3B8] text-sm font-medium">{children}</span>
          <span className="w-10 h-px bg-gradient-to-r from-transparent via-[#F7931E]/50 to-transparent" />
        </div>
      </td>
    </tr>
  );
}

export function DataTableActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity", className)}>
      {children}
    </div>
  );
}

export function DataTableIconButton({
  title,
  onClick,
  disabled,
  children,
  className,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150",
        "text-[#64748B] bg-transparent border border-transparent",
        "hover:text-[#0B1F3A] hover:bg-white hover:border-[#0B1F3A]/10",
        "hover:shadow-[0_2px_8px_-2px_rgba(11,31,58,0.12)]",
        "active:scale-[0.96]",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none",
        className,
      )}
    >
      {children}
    </button>
  );
}
