import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { FormField, Input, Textarea } from "@/components/portal/FormField";
import { DealStatusBadge } from "@/components/portal/DealStatusBadge";
import { DealPdfPreview } from "@/components/portal/DealPdfPreview";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { getDealById, setDealStatus } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { defaultDealRegistrationForm, type DealRegistrationFormData } from "@/lib/deal-registration-types";
import { formatDateTime } from "@/lib/utils";
import type { DealStatus } from "@/lib/types";

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, loading, error, refresh } = useApiQuery(() => getDealById(id!), [id], !!id);
  const [remarks, setRemarks] = useState("");
  const [dealId, setDealId] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [registrationDate, setRegistrationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!deal?.formData) return;
    setRemarks(deal.formData.remarks || deal.remarks || "");
    setDealId(deal.formData.dealId || "");
    setRegisteredBy(deal.formData.registeredBy || "");
    setRegistrationDate(deal.formData.registrationDate || new Date().toISOString().slice(0, 10));
  }, [deal]);

  const form: DealRegistrationFormData = {
    ...defaultDealRegistrationForm(),
    ...(deal?.formData ?? {}),
    remarks,
    dealId,
    registeredBy,
    registrationDate,
    approvalStatus: deal?.status ?? "pending",
  };

  async function updateStatus(status: DealStatus) {
    if (!id || saving) return;
    setSaving(true);
    setActionError("");
    try {
      await setDealStatus(id, {
        status,
        remarks: remarks || null,
        dealId: dealId || null,
        registeredBy: registeredBy || null,
        registrationDate: registrationDate || null,
      });
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-[#64748B]">Loading deal…</div>
    );
  }

  if (!deal) {
    return (
      <div className="p-8">
        <ApiErrorAlert message={error ?? "Deal not found"} onRetry={refresh} />
        <Button className="mt-4" variant="outline" onClick={() => navigate("/admin/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={deal.id}
        subtitle={`${deal.partnerCompanyName} · ${deal.endCustomerName}`}
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DealStatusBadge status={deal.status} />
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate("/admin/dashboard")}>
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full space-y-4">
        <ApiErrorAlert message={error || actionError || null} onRetry={refresh} />

        <div className="grid xl:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-sm p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F3A]">Summary</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Partner</p><p className="font-medium text-[#0B1F3A]">{deal.partnerCompanyName}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Contact</p><p className="font-medium text-[#0B1F3A]">{deal.contactPerson}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Email</p><p className="font-medium text-[#0B1F3A]">{deal.email}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">End Customer</p><p className="font-medium text-[#0B1F3A]">{deal.endCustomerName}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Project</p><p className="font-medium text-[#0B1F3A]">{deal.projectName || "—"}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Value (USD)</p><p className="font-medium text-[#0B1F3A]">{deal.estimatedValueUsd || "—"}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Submitted</p><p className="font-medium text-[#0B1F3A]">{deal.submittedAt ? formatDateTime(deal.submittedAt) : "—"}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">Submitted by</p><p className="font-medium text-[#0B1F3A]">{deal.createdByName || "—"}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-sm p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F3A]">Salicru Review</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Deal ID" half>
                  <Input value={dealId} onChange={setDealId} placeholder="Internal deal ID" />
                </FormField>
                <FormField label="Registered By" half>
                  <Input value={registeredBy} onChange={setRegisteredBy} placeholder="Salicru representative" />
                </FormField>
                <FormField label="Date of Registration" half>
                  <Input type="date" value={registrationDate} onChange={setRegistrationDate} />
                </FormField>
              </div>
              <FormField label="Remarks">
                <Textarea value={remarks} onChange={setRemarks} placeholder="Approval remarks" rows={2} />
              </FormField>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="gold"
                  disabled={saving}
                  icon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  onClick={() => updateStatus("approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => updateStatus("pending")}
                >
                  Mark Pending
                </Button>
                <Button
                  variant="danger"
                  disabled={saving}
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => updateStatus("rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-sm p-3 min-h-[420px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Submitted Document</span>
            </div>
            <div className="rounded-xl bg-[#DDE2E8] p-2 overflow-auto max-h-[70vh] scrollbar-thin">
              <DealPdfPreview data={form} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
