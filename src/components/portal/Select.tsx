import { Check, ChevronDown } from "lucide-react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

const contentClass =
  "z-50 overflow-hidden rounded-xl border border-[#0B1F3A]/12 bg-white portal-panel " +
  "animate-in fade-in-0 zoom-in-95 shadow-lg";

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
  icon?: React.ReactNode;
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
  icon,
}: PortalSelectProps) {
  const items = normalizeOptions(options);

  return (
    <RadixSelect.Root value={value || undefined} onValueChange={onChange}>
      <RadixSelect.Trigger
        className={cn(
          "relative h-9 inline-flex items-center gap-1.5 rounded-xl border border-[#0B1F3A]/12",
          "bg-[#F8F9FC] text-sm text-[#0B1F3A] cursor-pointer whitespace-nowrap",
          "focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 focus:border-[#F7931E] transition-all",
          icon ? "pl-9 pr-2.5" : "pl-2.5 pr-2.5",
          className,
        )}
        aria-label={placeholder}
      >
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[#94A3B8] [&>svg]:size-4">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left leading-none">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown className="size-3.5 flex-shrink-0 text-[#94A3B8]" />
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
