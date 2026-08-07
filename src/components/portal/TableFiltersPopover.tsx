import { useMemo, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import type { PortalSelectOption } from "./Select";
import { cn } from "@/lib/utils";

export interface TableFilterField {
  key: string;
  label: string;
  /** Selected option values. Empty array = no filter (show all). */
  values?: string[];
  options?: PortalSelectOption[] | string[];
  onChange: (values: string[]) => void;
}

interface TableFiltersPopoverProps {
  fields: TableFilterField[];
  title?: string;
  className?: string;
}

function normalizeOptions(options?: PortalSelectOption[] | string[]): PortalSelectOption[] {
  return (options ?? [])
    .map(o => (typeof o === "string" ? { value: o, label: o } : o))
    .filter(o => o.value && o.value !== "all");
}

function selectedValues(field: TableFilterField): string[] {
  return Array.isArray(field.values) ? field.values.filter(v => v && v !== "all") : [];
}

/** Encode multi-select values for API query params. */
export function toFilterParam(values?: string[] | null): string | undefined {
  if (!Array.isArray(values)) return undefined;
  const cleaned = values.filter(v => v && v !== "all");
  return cleaned.length ? cleaned.join(",") : undefined;
}

export function TableFiltersPopover({
  fields,
  title = "Filters",
  className,
}: TableFiltersPopoverProps) {
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(
    () => fields.reduce((sum, f) => sum + selectedValues(f).length, 0),
    [fields],
  );

  function clearAll() {
    for (const field of fields) {
      if (selectedValues(field).length) field.onChange([]);
    }
  }

  function toggleValue(field: TableFilterField, value: string) {
    const selected = new Set(selectedValues(field));
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    field.onChange(Array.from(selected));
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
          <ChevronDown className={cn("w-3.5 h-3.5 text-[#94A3B8] transition-transform", open && "rotate-180")} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(92vw,360px)] rounded-2xl border border-[#0B1F3A]/10 bg-white shadow-[0_16px_48px_-12px_rgba(11,31,58,0.25)] p-4 animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[#0B1F3A]">{title}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Select one or more options per filter</p>
            </div>
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

          <div className="space-y-4 max-h-[min(60vh,420px)] overflow-y-auto pr-1 scrollbar-thin">
            {fields.map(field => {
              const options = normalizeOptions(field.options);
              const selected = new Set(selectedValues(field));
              return (
                <div key={field.key} className="rounded-xl border border-[#0B1F3A]/8 bg-[#F8F9FC]/80 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                      {field.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {selected.size > 0 && (
                        <button
                          type="button"
                          onClick={() => field.onChange([])}
                          className="text-[10px] font-semibold text-[#94A3B8] hover:text-[#F7931E]"
                        >
                          Clear
                        </button>
                      )}
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        selected.size > 0
                          ? "bg-[#F7931E]/15 text-[#C46A0A]"
                          : "bg-white text-[#94A3B8] border border-[#0B1F3A]/8",
                      )}>
                        {selected.size > 0 ? `${selected.size} selected` : "All"}
                      </span>
                    </div>
                  </div>

                  {options.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] py-1">No options yet</p>
                  ) : (
                    <div className="space-y-1">
                      {options.map(opt => {
                        const checked = selected.has(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleValue(field, opt.value)}
                            className={cn(
                              "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                              checked
                                ? "bg-white text-[#0B1F3A] shadow-sm border border-[#F7931E]/25"
                                : "text-[#334155] hover:bg-white/80 border border-transparent",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 transition-colors",
                                checked
                                  ? "bg-[#F7931E] border-[#F7931E] text-white"
                                  : "bg-white border-[#0B1F3A]/20",
                              )}
                            >
                              {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                            </span>
                            <span className={cn("min-w-0 flex-1 truncate", checked && "font-semibold")}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
