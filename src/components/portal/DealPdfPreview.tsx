import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { DealRegistrationFormData } from "@/lib/deal-registration-types";
import { fillDealRegistrationPdf, preloadDealPdfTemplate } from "@/lib/fill-deal-registration-pdf";
import { cn } from "@/lib/utils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface DealPdfPreviewProps {
  data: DealRegistrationFormData;
  className?: string;
  maxWidth?: number;
}

export function DealPdfPreview({ data, className, maxWidth = 620 }: DealPdfPreviewProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState(false);
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

  const generate = useCallback(async (formData: DealRegistrationFormData, genId: number) => {
    try {
      const bytes = await fillDealRegistrationPdf(formData);
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
    preloadDealPdfTemplate();
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
    if (hasRenderedRef.current) setIsSyncing(true);

    const delay = hasRenderedRef.current ? 800 : 100;
    debounceRef.current = setTimeout(() => {
      const genId = ++genIdRef.current;
      generate(dataRef.current, genId);
      hasRenderedRef.current = true;
    }, delay);

    return () => clearTimeout(debounceRef.current);
  }, [dataKey, generate]);

  return (
    <div ref={containerRef} className={cn("relative w-full min-h-[320px]", className)}>
      {isSyncing && pdfData && (
        <div className="absolute top-0 left-0 right-0 z-20 h-0.5 overflow-hidden rounded-full">
          <div className="h-full bg-[#F7931E] animate-pulse w-full" />
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
        <Document
          file={pdfFile}
          loading={null}
          onLoadError={() => setError(true)}
          className="flex flex-col items-center w-full pb-4"
        >
          <Page
            pageNumber={1}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg border border-black/10 bg-white"
          />
        </Document>
      ) : null}
    </div>
  );
}
