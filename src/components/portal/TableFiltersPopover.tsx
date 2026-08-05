import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { PortalSelect, type PortalSelectOption } from "./Select";
import { cn } from "@/lib/utils";

export interface TableFilterField {
  key: string;
  label: string;
  value: string;
  options: PortalSelectOption[] | string[];
  onChange: (value: string) => void;
}

interface TableFiltersPopoverProps {
  fields: TableFilterField[];
  title?: string;
  className?: string;
}

export function TableFiltersPopover({
  fields,
  title = "Filters",
  className,
}: TableFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const activeCount = fields.filter(f => f.value && f.value !== "all").length;

  function clearAll() {
    for (const field of fields) {
      if (field.value !== "all") field.onChange("all");
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "relative h-9 px-3.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30",
            activeCount > 0
              ? "border-[#F7931E]/50 bg-[#F7931E]/8 text-[#0B1F3A]"
              : "border-[#0B1F3A]/12 bg-[#F8F9FC] text-[#0B1F3A] hover:bg-[#EEF1F6]",
            className,
          )}
        >
          <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />
          Filters
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F7931E] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[280px] rounded-2xl border border-[#0B1F3A]/10 bg-white shadow-[0_16px_48px_-12px_rgba(11,31,58,0.25)] p-4 animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0B1F3A]">{title}</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-[#F7931E] hover:text-[#d97b0d] transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.key} className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#64748B] w-14 flex-shrink-0">{field.label}</span>
                <PortalSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={field.options}
                  className="flex-1 min-w-0"
                />
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
