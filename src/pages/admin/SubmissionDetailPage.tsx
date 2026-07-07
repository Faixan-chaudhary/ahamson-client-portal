import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Download, Printer, Link2, Eye, FileText, CheckCircle, Check } from "lucide-react";
import { PdfFormPreview } from "@/components/portal/PdfFormPreview";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/portal/Button";
import { FormField, Input } from "@/components/portal/FormField";
import { Card, CardHeader } from "@/components/portal/Card";
import { getSubmissionById, saveInternalApproval } from "@/lib/storage";
import { formatDateTime } from "@/lib/utils";
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
  const { data: sub, loading } = useApiQuery(() => getSubmissionById(id ?? ""), [id]);
  const [approval, setApproval] = useState<InternalApproval>(emptyApproval());
  const { active: approvalSaved, trigger: triggerApprovalSaved } = useActionFeedback();

  useEffect(() => {
    if (sub?.approval) setApproval(sub.approval);
  }, [sub]);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#94A3B8]">Loading submission…</div>
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

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#0B1F3A]/8 px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20 flex-wrap gap-3 shadow-[0_1px_3px_rgba(11,31,58,0.04)]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0B1F3A] text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-[#0B1F3A]/20">/</span>
          <span className="font-['JetBrains_Mono'] text-sm text-[#0B1F3A] font-medium bg-[#EEF1F7] px-2 py-0.5 rounded-lg">{sub.id}</span>
          <StatusBadge status={sub.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer className="w-4 h-4" />}>Print</Button>
          <Button variant="outline" icon={<Download className="w-4 h-4" />} disabled title="PDF download coming soon">Download PDF</Button>
        </div>
      </header>

      <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <div className="px-7 py-6 flex flex-wrap items-center justify-between gap-4" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Client Company</p>
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-white">{sub.clientCompany}</h2>
              <p className="text-white/50 text-sm mt-1">{sub.contactPerson} · {sub.email}</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-['Playfair_Display'] font-bold text-[#0B1F3A] mb-5">Activity Timeline</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex-1 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.done ? "bg-emerald-50 text-emerald-600" : "bg-[#F4F6FA] text-[#94A3B8]"}`}>
                  <t.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0B1F3A]">{t.label}</p>
                  <p className="text-xs text-[#94A3B8]">{t.time ? formatDateTime(t.time) : "Pending"}</p>
                </div>
                {i < timeline.length - 1 && <div className="hidden sm:block flex-1 h-px bg-[#0B1F3A]/10 self-center ml-2" />}
              </div>
            ))}
          </div>
        </Card>

        {sub.status === "submitted" ? (
          <div className="bg-[#DDE2E8] p-4 rounded-2xl">
            <PdfFormPreview data={formData} showAllPages />
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-[#64748B]">Document not yet submitted by client.</p>
            {sub.status !== "expired" && (
              <p className="text-xs text-[#94A3B8] mt-2">Link expires: {formatDateTime(sub.expiresAt)}</p>
            )}
          </Card>
        )}

        <Card>
          <CardHeader title="Internal Approval" subtitle="For office use only — Page 2" />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="px-6 pb-6">
            <Button
              variant="gold"
              onClick={handleSaveApproval}
              className={approvalSaved ? "!from-emerald-500 !to-emerald-600" : undefined}
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
