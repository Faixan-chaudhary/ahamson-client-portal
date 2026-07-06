import { cn } from "@/lib/utils";
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
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-[11px] font-semibold text-[#0B1F3A]/60 uppercase tracking-[0.1em] mb-1">
        {label}{required && <span className="text-[#F7931E] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass = "w-full py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-[#0B1F3A] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 focus:border-[#F7931E] transition-all";

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  options?: string[];
}

export function Input({ value, onChange, type = "text", placeholder, icon, options }: InputProps) {
  return (
    <div className="relative group">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#F7931E] transition-colors z-10">{icon}</span>}
      {options ? (
        <>
          {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#F7931E] transition-colors z-10 pointer-events-none">{icon}</span>}
          <PortalSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder="Select..."
            withLeadingIcon={!!icon}
          />
        </>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={cn(inputClass, icon ? "pl-10 pr-3.5" : "px-3.5")} />
      )}
    </div>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className={cn(inputClass, "px-3.5 resize-none")} />
  );
}
