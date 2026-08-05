import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, icon, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[3px] px-0 sm:px-4 font-['Inter']" onClick={onClose}>
      <div
        className={cn(
          "bg-white shadow-2xl w-full overflow-hidden border border-[#0B1F3A]/8",
          "rounded-t-3xl sm:rounded-3xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col",
          wide ? "max-w-3xl" : "max-w-[540px]",
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-4 sm:px-5 py-4 overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg, #0B1F3A, #162d52)" }}>
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-white leading-tight">{title}</h3>
              {subtitle && <p className="text-white/45 text-xs mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
