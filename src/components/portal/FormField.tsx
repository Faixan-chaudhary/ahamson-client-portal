import { cn } from "@/lib/utils";
import { portalControlIconLeft, portalInputClass, portalInputPadding } from "@/lib/control-styles";
import { PortalSelect } from "./Select";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  half?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, required, error, half, children }: FormFieldProps) {
  return (
    <div className={half ? "col-span-1" : "col-span-1 sm:col-span-2"}>
      <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1">
        {label}{required && <span className="text-[#F7931E] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass = portalInputClass;

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  options?: string[];
  autoComplete?: string;
  name?: string;
}

export function Input({ value, onChange, type = "text", placeholder, icon, options, autoComplete, name }: InputProps) {
  if (options) {
    return (
      <PortalSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder || "Select..."}
        icon={icon}
      />
    );
  }

  return (
    <div className="relative group">
      {icon && (
        <span className={cn(
          "absolute top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#F7931E] transition-colors z-10",
          portalControlIconLeft,
        )}>
          {icon}
        </span>
      )}
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, icon ? portalInputPadding.withIcon : portalInputPadding.default)}
      />
    </div>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className={cn(inputClass, portalInputPadding.default, "resize-none")} />
  );
}
