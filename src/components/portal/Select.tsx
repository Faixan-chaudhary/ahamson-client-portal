import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const triggerClass =
  "w-full py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-[#0B1F3A] text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 focus:border-[#F7931E] transition-all " +
  "flex items-center justify-between gap-2 cursor-pointer";

const contentClass =
  "z-50 overflow-hidden rounded-xl border border-[#0B1F3A]/12 bg-white portal-panel " +
  "animate-in fade-in-0 zoom-in-95";

const itemClass =
  "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-[#0B1F3A] " +
  "outline-none data-[highlighted]:bg-[#F7931E]/15 data-[highlighted]:text-[#0B1F3A] " +
  "data-[state=checked]:font-semibold";

export interface PortalSelectOption {
  value: string;
  label: string;
}

interface PortalSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PortalSelectOption[] | string[];
  placeholder?: string;
  className?: string;
  /** Extra left padding when an icon sits outside the trigger */
  withLeadingIcon?: boolean;
}

function normalizeOptions(options: PortalSelectOption[] | string[]): PortalSelectOption[] {
  return options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
}

export function PortalSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  withLeadingIcon,
}: PortalSelectProps) {
  const items = normalizeOptions(options);

  return (
    <RadixSelect.Root value={value || undefined} onValueChange={onChange}>
      <RadixSelect.Trigger
        className={cn(triggerClass, withLeadingIcon ? "pl-9 pr-8" : "px-3.5", className)}
        aria-label={placeholder}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className={contentClass} position="popper" sideOffset={4}>
          <RadixSelect.Viewport className="p-1 min-w-[var(--radix-select-trigger-width)]">
            {items.map(opt => (
              <RadixSelect.Item key={opt.value} value={opt.value} className={itemClass}>
                <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  <RadixSelect.ItemIndicator>
                    <Check className="w-4 h-4 text-[#F7931E]" strokeWidth={2.5} />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
