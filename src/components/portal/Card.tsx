import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-[#0B1F3A]/8 portal-panel", className)}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.FC<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3 bg-[#F4F6FA] border-b border-[#0B1F3A]/6">
      {Icon && <Icon className="w-4 h-4 text-[#64748B]" />}
      <div>
        <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-[10px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#0B1F3A]/5 last:border-0">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <span className="text-xs font-semibold text-[#0B1F3A] text-right max-w-[55%]">
        {value || <span className="text-[#CBD5E1]">—</span>}
      </span>
    </div>
  );
}
