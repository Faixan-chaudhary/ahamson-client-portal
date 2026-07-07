import { useState } from "react";
import { Eye, X } from "lucide-react";
import type { DocumentFormData } from "@/lib/types";
import { PdfFormPreview, computeFormProgress } from "./PdfFormPreview";
import { cn } from "@/lib/utils";

interface LiveDocumentPanelProps {
  data: DocumentFormData;
  activeSection?: number;
  floating?: boolean;
}

export function LiveDocumentPanel({ data, activeSection, floating }: LiveDocumentPanelProps) {
  const [open, setOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<1 | 2>(1);
  const progress = computeFormProgress(data);

  const panel = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Live Document</span>
          <span className="text-[9px] text-[#94A3B8] font-medium hidden sm:inline">· Official PDF</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F6FA] rounded-lg p-0.5">
            <button onClick={() => setPreviewPage(1)} className={cn("px-2 py-0.5 rounded text-[10px] font-bold transition-all", previewPage === 1 ? "bg-white shadow text-[#0B1F3A]" : "text-[#94A3B8]")}>Pg 1</button>
            <button onClick={() => setPreviewPage(2)} className={cn("px-2 py-0.5 rounded text-[10px] font-bold transition-all", previewPage === 2 ? "bg-white shadow text-[#0B1F3A]" : "text-[#94A3B8]")}>Pg 2</button>
          </div>
          {floating && (
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-[#F4F6FA] flex items-center justify-center">
              <X className="w-4 h-4 text-[#64748B]" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex-shrink-0">
        <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
          <span>Document completion</span>
          <span className="font-bold text-[#F7931E]">{progress}%</span>
        </div>
        <div className="h-1.5 bg-[#0B1F3A]/8 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#F7931E] to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl bg-[#DDE2E8] p-2 shadow-inner scrollbar-thin">
        <PdfFormPreview data={data} pageNumber={previewPage} />
      </div>

      <p className="text-[10px] text-[#94A3B8] text-center mt-2 flex-shrink-0">
        Real registration form · Updates as you type
      </p>
    </div>
  );

  if (floating) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="xl:hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: "linear-gradient(135deg, #0B1F3A, #162d52)" }}>
          <Eye className="w-4 h-4 text-[#F7931E]" />
          <span>Live PDF</span>
          <span className="bg-[#F7931E] text-[#0B1F3A] text-[10px] font-black px-1.5 py-0.5 rounded-full">{progress}%</span>
        </button>
        {open && (
          <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
            <div className="bg-white rounded-b-3xl shadow-2xl flex flex-col max-h-[92vh] p-4 pt-5 min-h-0">
              {panel}
            </div>
            <div className="flex-1" onClick={() => setOpen(false)} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="hidden xl:flex flex-col sticky top-24 h-[calc(100vh-120px)] bg-white rounded-2xl border border-[#0B1F3A]/10 shadow-xl p-3 lg:p-4 min-h-0 min-w-0 w-full">
      {panel}
    </div>
  );
}

export function LiveDocumentPanelMobile(props: LiveDocumentPanelProps) {
  return <LiveDocumentPanel {...props} floating />;
}
