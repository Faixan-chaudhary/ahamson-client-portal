import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  fileName: string | null;
  onChange: (name: string | null) => void;
  checked?: boolean;
  onCheck?: (v: boolean) => void;
}

export function FileUpload({ label, required, fileName, onChange, checked, onCheck, error }: FileUploadProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all",
      checked ? "border-[#F7931E]/40 bg-[#F7931E]/5" : "border-[#0B1F3A]/10 bg-[#F8F9FC]")}>
      {onCheck !== undefined && (
        <input type="checkbox" checked={checked} onChange={e => onCheck(e.target.checked)}
          className="w-4 h-4 rounded border-[#0B1F3A]/20 text-[#F7931E] focus:ring-[#F7931E]/30" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0B1F3A]">{label}</p>
        {fileName && (
          <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
            <FileText className="w-3 h-3 flex-shrink-0" />{fileName}
          </p>
        )}
      </div>
      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B1F3A]/12 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-[#F4F6FA] cursor-pointer transition-all flex-shrink-0">
        <Upload className="w-3.5 h-3.5" />
        {fileName ? "Change" : "Upload"}
        <input type="file" className="hidden" onChange={e => {
          const f = e.target.files?.[0];
          onChange(f ? f.name : null);
          if (onCheck && f) onCheck(true);
        }} />
      </label>
      {fileName && (
        <button onClick={() => { onChange(null); onCheck?.(false); }} className="text-[#94A3B8] hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
