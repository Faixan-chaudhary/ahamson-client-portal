import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { CheckCircle, Download, Printer, Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/portal/Logo";
import { PdfFormPreview } from "@/components/portal/PdfFormPreview";
import { Button } from "@/components/portal/Button";
import { AnimatedIconSwap } from "@/components/portal/AnimatedIconSwap";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { getSubmittedDocument, getSubmissionByToken } from "@/lib/storage";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import { fillRegistrationPdfBlob, preloadPdfTemplate } from "@/lib/fill-registration-pdf";
import { NAVY, GOLD } from "@/lib/constants";
import type { DocumentFormData, Submission } from "@/lib/types";
import { useApiQuery } from "@/hooks/useApiQuery";
import { cn } from "@/lib/utils";

export function PreviewPage() {
  const { token } = useParams<{ token: string }>();
  const { data: sub, loading: subLoading } = useApiQuery(() => getSubmissionByToken(token ?? ""), [token]);
  const { data: submitted, loading: docLoading } = useApiQuery(() => getSubmittedDocument(token ?? ""), [token]);
  const data: DocumentFormData = submitted ?? defaultDocumentForm();
  const submission = sub as Submission | null;
  const { active: downloaded, trigger: triggerDownloaded } = useActionFeedback();
  const [downloadError, setDownloadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(true);

  useEffect(() => {
    preloadPdfTemplate();
  }, []);

  async function downloadPdf() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const blob = await fillRegistrationPdfBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AHamson-Client-Registration-${submission?.id ?? token}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      triggerDownloaded();
    } catch {
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 2500);
    } finally {
      setDownloading(false);
    }
  }

  if (subLoading || docLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE2E8]">
        <p className="text-[#64748B]">Loading preview…</p>
      </div>
    );
  }

  const downloadLabel = downloadError
    ? "Download failed"
    : downloading
      ? "Preparing PDF…"
      : downloaded
        ? "Downloaded"
        : "Download PDF";

  return (
    <div className="min-h-screen bg-[#DDE2E8] font-['Inter']">
      <header className="border-b border-white/10 px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2 print:hidden sticky top-0 z-20 flex-wrap" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <Logo light size="sm" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()} className="!text-white !border-white/20 !bg-white/10 flex-1 sm:flex-initial">
            Print
          </Button>
          <Button
            variant="gold"
            onClick={downloadPdf}
            disabled={downloading}
            aria-busy={downloading}
            className={cn("flex-1 sm:flex-initial", downloadError ? "!bg-red-500" : downloaded && !downloading ? "!from-emerald-500 !to-emerald-600" : undefined)}
            icon={
              downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AnimatedIconSwap
                  active={downloaded}
                  idle={<Download className="w-4 h-4" />}
                  activeIcon={<Check className="w-4 h-4" strokeWidth={2.5} />}
                />
              )
            }
          >
            <span className="sm:hidden">{downloading ? "…" : downloaded ? "Done" : "PDF"}</span>
            <span className="hidden sm:inline">{downloadLabel}</span>
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-4 pb-8 print:py-0 print:px-0 print:max-w-none">
        <div className="print:block overflow-x-auto">
          <p className="text-center text-xs text-[#94A3B8] mb-4 print:hidden font-semibold uppercase tracking-widest">Official Client Registration Form</p>
          <PdfFormPreview data={data} showAllPages className="!min-h-0" />
        </div>

        <p className="text-center text-[#94A3B8] text-xs mt-6 print:hidden">Read-only preview of your submitted registration form · Page 1 & 2</p>
      </div>

      {showSuccess && (
        <div className="print:hidden fixed bottom-5 inset-x-3 sm:inset-x-auto sm:right-5 z-30 w-auto sm:w-[min(92vw,22rem)]">
          <div className="rounded-2xl border border-[#0B1F3A]/10 bg-white shadow-2xl overflow-hidden">
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${GOLD}, #10B981, ${GOLD})` }} />
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-['Playfair_Display'] text-sm font-bold text-[#0B1F3A] leading-snug">
                  Document submitted successfully
                </p>
                <p className="mt-0.5 text-[11px] text-[#64748B] leading-snug">
                  {submission?.clientCompany && <>Submitted for <strong>{submission.clientCompany}</strong></>}
                  {submission?.submittedAt && <> · {new Date(submission.submittedAt).toLocaleString("en-GB")}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#94A3B8] hover:bg-[#F4F6FA] hover:text-[#0B1F3A]"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
