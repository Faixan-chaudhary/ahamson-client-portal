import { useId } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  required?: boolean;
  fileName: string | null;
  onChange: (name: string | null) => void;
  error?: string;
}

export function FileUpload({ label, required, fileName, onChange, error }: FileUploadProps) {
  const inputId = useId();
  const uploaded = !!fileName;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border",
          error ? "border-red-500" : uploaded ? "border-[#F7931E]/40 bg-[#F7931E]/5" : "border-[#0B1F3A]/10 bg-[#F8F9FC]",
        )}
      >
        <span
          className={cn(
            "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px]",
            uploaded ? "border-[#F7931E] bg-[#F7931E] text-white" : "border-[#0B1F3A]/20 bg-white",
          )}
          aria-hidden
        >
          {uploaded ? "✓" : ""}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0B1F3A]">
            {label}
            {required && <span className="text-[#F7931E] ml-0.5">*</span>}
          </p>
          {fileName && (
            <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
              <FileText className="w-3 h-3 flex-shrink-0" />
              {fileName}
            </p>
          )}
        </div>
        <label
          htmlFor={inputId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B1F3A]/12 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-[#F4F6FA] cursor-pointer transition-all flex-shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          {fileName ? "Change" : "Upload"}
        </label>
        <input
          id={inputId}
          type="file"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            onChange(f ? f.name : null);
            e.target.value = "";
          }}
        />
        {fileName && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[#94A3B8] hover:text-red-500 transition-colors"
            aria-label={`Remove ${label}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
