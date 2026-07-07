import { useParams } from "react-router";
import { useState } from "react";
import { CheckCircle, Download, Printer, Check } from "lucide-react";
import { Logo } from "@/components/portal/Logo";
import { PdfFormPreview } from "@/components/portal/PdfFormPreview";
import { Button } from "@/components/portal/Button";
import { AnimatedIconSwap } from "@/components/portal/AnimatedIconSwap";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { getSubmittedDocument, getSubmissionByToken } from "@/lib/storage";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import { fillRegistrationPdfBlob } from "@/lib/fill-registration-pdf";
import { NAVY, GOLD } from "@/lib/constants";
import type { DocumentFormData, Submission } from "@/lib/types";
import { useApiQuery } from "@/hooks/useApiQuery";

export function PreviewPage() {
  const { token } = useParams<{ token: string }>();
  const { data: sub, loading: subLoading } = useApiQuery(() => getSubmissionByToken(token ?? ""), [token]);
  const { data: submitted, loading: docLoading } = useApiQuery(() => getSubmittedDocument(token ?? ""), [token]);
  const data: DocumentFormData = submitted ?? defaultDocumentForm();
  const submission = sub as Submission | null;
  const { active: downloaded, trigger: triggerDownloaded } = useActionFeedback();
  const [downloadError, setDownloadError] = useState(false);

  async function downloadPdf() {
    setDownloadError(false);
    try {
      const blob = await fillRegistrationPdfBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AHamson-Client-Registration-${submission?.id ?? token}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      triggerDownloaded();
    } catch {
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 2500);
    }
  }

  if (subLoading || docLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE2E8]">
        <p className="text-[#64748B]">Loading preview…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DDE2E8] font-['Inter']">
      <header className="border-b border-white/10 px-6 py-3.5 flex items-center justify-between print:hidden sticky top-0 z-20" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <Logo light />
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()} className="!text-white !border-white/20 !bg-white/10">Print</Button>
          <Button
            variant="gold"
            onClick={downloadPdf}
            className={downloadError ? "!bg-red-500" : downloaded ? "!from-emerald-500 !to-emerald-600" : undefined}
            icon={
              <AnimatedIconSwap
                active={downloaded}
                idle={<Download className="w-4 h-4" />}
                activeIcon={<Check className="w-4 h-4" strokeWidth={2.5} />}
              />
            }
          >
            {downloadError ? "Download failed" : downloaded ? "Downloaded" : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-4 print:py-0 print:px-0 print:max-w-none">
        <div className="bg-white rounded-3xl border border-[#0B1F3A]/8 shadow-xl overflow-hidden mb-8 print:hidden">
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${GOLD}, #10B981, ${GOLD})` }} />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#0B1F3A]">Your document has been submitted successfully.</h1>
            <p className="text-[#64748B] text-sm mt-2">
              {submission?.clientCompany && <>Submitted for <strong>{submission.clientCompany}</strong></>}
              {submission?.submittedAt && <> · {new Date(submission.submittedAt).toLocaleString("en-GB")}</>}
            </p>
          </div>
        </div>

        <div className="print:block">
          <p className="text-center text-xs text-[#94A3B8] mb-4 print:hidden font-semibold uppercase tracking-widest">Official Client Registration Form</p>
          <PdfFormPreview data={data} showAllPages />
        </div>

        <p className="text-center text-[#94A3B8] text-xs mt-6 print:hidden">Read-only preview of your submitted registration form.</p>
      </div>
    </div>
  );
}
