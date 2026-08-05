import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { DocumentFormData } from "@/lib/types";
import { fillRegistrationPdf, preloadPdfTemplate } from "@/lib/fill-registration-pdf";
import { DOCUMENT_CHECKLIST_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfFormPreviewProps {
  data: DocumentFormData;
  pageNumber?: number;
  className?: string;
  showAllPages?: boolean;
  maxWidth?: number;
}

export function computeFormProgress(data: DocumentFormData): number {
  const fields = [
    data.legalName, data.poBox, data.emirate, data.telephone, data.email,
    data.businessNature, data.legalStatus, data.tradeLicenseNumber,
    data.ownerName, data.gmName,
  ];
  const filled = fields.filter(f => f?.trim()).length;
  const sigs = [...data.lpoSignatories, ...data.chequeSignatories].filter(p => p.signature).length;
  const docs = Object.values(data.documents).filter(Boolean).length;
  const total = fields.length + 4 + DOCUMENT_CHECKLIST_ITEMS.length;
  return Math.min(100, Math.round(((filled + sigs + docs + (data.declarationSignature ? 1 : 0)) / total) * 100));
}

export function PdfFormPreview({ data, pageNumber = 1, className, showAllPages = false, maxWidth = 620 }: PdfFormPreviewProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState(2);
  const [width, setWidth] = useState(560);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const genIdRef = useRef(0);
  const hasRenderedRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const dataKey = useMemo(() => JSON.stringify(data), [data]);

  const generate = useCallback(async (formData: DocumentFormData, genId: number) => {
    try {
      const bytes = await fillRegistrationPdf(formData);
      if (genId !== genIdRef.current) return;
      setPdfData(bytes);
      setError(false);
    } catch {
      if (genId === genIdRef.current) setError(true);
    } finally {
      if (genId === genIdRef.current) {
        setIsFirstLoad(false);
        setIsSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    preloadPdfTemplate();
  }, []);

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData } : null),
    [pdfData],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.max(280, Math.min(Math.round(entry.contentRect.width - 8), maxWidth));
      setWidth(w => (Math.abs(w - next) > 4 ? next : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (pdfData) setIsSyncing(true);

    const delay = hasRenderedRef.current ? 800 : 100;
    debounceRef.current = setTimeout(() => {
      const genId = ++genIdRef.current;
      generate(dataRef.current, genId);
      hasRenderedRef.current = true;
    }, delay);

    return () => clearTimeout(debounceRef.current);
  }, [dataKey, generate]);

  const pages = showAllPages ? Array.from({ length: numPages }, (_, i) => i + 1) : [pageNumber];

  return (
    <div ref={containerRef} className={cn("relative w-full min-h-[320px]", className)}>
      {isSyncing && pdfData && (
        <div className="absolute top-0 left-0 right-0 z-20 h-0.5 overflow-hidden rounded-full">
          <div className="h-full bg-[#F7931E] animate-[shimmer_1s_ease-in-out_infinite] w-full origin-left scale-x-[0.3]" />
        </div>
      )}

      {isFirstLoad && !pdfData && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-2 border-[#F7931E] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-[#94A3B8] font-medium">Loading document…</p>
          </div>
        </div>
      )}

      {error && !pdfData ? (
        <div className="p-8 text-center text-sm text-red-500">Could not load PDF preview</div>
      ) : pdfFile ? (
        <div>
          <Document
            file={pdfFile}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={null}
            className="flex flex-col items-center gap-6 w-full pb-4"
          >
            {pages.map(p => (
              <div key={p} className="w-full flex flex-col items-center gap-2">
                <Page
                  pageNumber={p}
                  width={width}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg border border-black/10 bg-white"
                />
                {showAllPages && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] print:hidden">
                    Page {p}/{numPages}
                  </p>
                )}
              </div>
            ))}
          </Document>
        </div>
      ) : null}
    </div>
  );
}
