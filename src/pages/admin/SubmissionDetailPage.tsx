import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Download, Printer, Link2, Eye, FileText, CheckCircle, Check } from "lucide-react";
import { PdfFormPreview } from "@/components/portal/PdfFormPreview";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/portal/Button";
import { FormField, Input } from "@/components/portal/FormField";
import { Card, CardHeader } from "@/components/portal/Card";
import { getSubmissionById, saveInternalApproval } from "@/lib/storage";
import { formatDateTime, cn } from "@/lib/utils";
import { downloadSubmissionPdf } from "@/lib/download-submission-pdf";
import { NAVY, GOLD } from "@/lib/constants";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import type { InternalApproval } from "@/lib/types";
import { useApiQuery } from "@/hooks/useApiQuery";

const emptyApproval = (): InternalApproval => ({
  salesName: "",
  salesSrNo: "",
  salesAdminName: "",
  businessUnitManager: "",
  accountantName: "",
  financeManager: "",
  documentController: "",
  approvedCreditDays: "",
  creditLimit: "",
  approvedByGM: "",
  gmSignatureDate: "",
});

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sub, loading, error } = useApiQuery(() => getSubmissionById(id ?? ""), [id]);
  const [approval, setApproval] = useState<InternalApproval>(emptyApproval());
  const { active: approvalSaved, trigger: triggerApprovalSaved } = useActionFeedback();
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (sub?.approval) setApproval(sub.approval);
  }, [sub]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#94A3B8]">Loading submission…</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">{error}</div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#64748B]">Submission not found.</p>
        <Button className="mt-4" onClick={() => navigate("/admin/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const formData = sub.formData ?? defaultDocumentForm();
  const timeline = [
    { icon: Link2, label: "Link Created", time: sub.createdAt, done: true },
    { icon: Eye, label: "Document Opened", time: sub.openedAt, done: !!sub.openedAt },
    { icon: FileText, label: "Document Submitted", time: sub.submittedAt, done: !!sub.submittedAt },
    { icon: CheckCircle, label: "PDF Generated", time: sub.submittedAt, done: sub.status === "submitted" },
  ];

  async function handleSaveApproval() {
    if (!id) return;
    await saveInternalApproval(id, approval);
    triggerApprovalSaved();
  }

  async function handleDownloadPdf() {
    if (sub.status !== "submitted" || !sub.formData) return;
    setPdfLoading(true);
    try {
      await downloadSubmissionPdf(formData, `AHamson-Client-Registration-${sub.id}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#0B1F3A]/8 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20 flex-wrap gap-2.5 sm:gap-3 shadow-[0_1px_3px_rgba(11,31,58,0.04)]">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0B1F3A] text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <span className="text-[#0B1F3A]/20 hidden sm:inline">/</span>
          <span className="font-['JetBrains_Mono'] text-xs sm:text-sm text-[#0B1F3A] font-medium bg-[#EEF1F7] px-2 py-0.5 rounded-lg truncate max-w-[140px] sm:max-w-none">{sub.id}</span>
          <StatusBadge status={sub.status} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()} className="flex-1 sm:flex-initial">
            <span className="sm:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadPdf}
            disabled={sub.status !== "submitted" || pdfLoading}
            className="flex-1 sm:flex-initial"
          >
            {pdfLoading ? "Preparing…" : <><span className="sm:hidden">PDF</span><span className="hidden sm:inline">Download PDF</span></>}
          </Button>
        </div>
      </header>

      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full">
        <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
          <div className="px-4 sm:px-7 py-5 sm:py-6 flex flex-wrap items-center justify-between gap-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
            <div className="min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Client Company</p>
              <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-white break-words">{sub.clientCompany}</h2>
              <p className="text-white/50 text-sm mt-1 break-words">{sub.contactPerson} · {sub.email}</p>
            </div>
          </div>
        </div>

        <Card className="p-4 sm:p-6">
          <h3 className="font-['Playfair_Display'] font-bold text-[#0B1F3A] mb-4 sm:mb-5">Activity Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex-1 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.done ? "bg-emerald-50 text-emerald-600" : "bg-[#F4F6FA] text-[#94A3B8]"}`}>
                  <t.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B1F3A]">{t.label}</p>
                  <p className="text-xs text-[#94A3B8]">{t.time ? formatDateTime(t.time) : "Pending"}</p>
                </div>
                {i < timeline.length - 1 && <div className="hidden lg:block flex-1 h-px bg-[#0B1F3A]/10 self-center ml-2" />}
              </div>
            ))}
          </div>
        </Card>

        {sub.status === "submitted" ? (
          <div className="bg-[#DDE2E8] p-2 sm:p-4 rounded-xl sm:rounded-2xl overflow-x-auto">
            <PdfFormPreview data={formData} showAllPages />
          </div>
        ) : (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-[#64748B]">Document not yet submitted by client.</p>
            {sub.status !== "expired" && (
              <p className="text-xs text-[#94A3B8] mt-2">Link expires: {formatDateTime(sub.expiresAt)}</p>
            )}
          </Card>
        )}

        <Card>
          <CardHeader title="Internal Approval" subtitle="For office use only — Page 2" />
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["salesName", "Sales Name"], ["salesSrNo", "SR No."],
              ["salesAdminName", "Sales Admin Name"], ["businessUnitManager", "Business Unit Manager Name"],
              ["accountantName", "Accountant Name"], ["financeManager", "Finance Manager Name"],
              ["documentController", "Document Controller Name"], ["approvedCreditDays", "Approved Credit Days"],
              ["creditLimit", "Credit Limit"], ["approvedByGM", "Approved by General Manager"],
              ["gmSignatureDate", "Signature & Date"],
            ] as const).map(([key, label]) => (
              <FormField key={key} label={label} half>
                <Input value={approval[key]} onChange={v => setApproval(p => ({ ...p, [key]: v }))} />
              </FormField>
            ))}
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Button
              variant="gold"
              onClick={handleSaveApproval}
              className={cn("w-full sm:w-auto", approvalSaved ? "!from-emerald-500 !to-emerald-600" : undefined)}
              icon={approvalSaved ? <Check className="w-4 h-4" strokeWidth={2.5} /> : undefined}
            >
              {approvalSaved ? "Saved" : "Save Approval"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
