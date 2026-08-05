import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Building2, Briefcase, Package, Swords, ClipboardList,
  PenLine, Download, Check, CheckCircle, RefreshCw, Save,
} from "lucide-react";
import { Logo } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { FormField, Input, Textarea } from "@/components/portal/FormField";
import { SignaturePad } from "@/components/portal/SignaturePad";
import { Modal } from "@/components/portal/Modal";
import { CountdownTimer } from "@/components/portal/CountdownTimer";
import { LiveDealDocumentPanel, LiveDealDocumentPanelMobile } from "@/components/portal/LiveDealDocumentPanel";
import { DealPdfPreview } from "@/components/portal/DealPdfPreview";
import { NAVY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  defaultDealRegistrationForm,
  type BatteryType,
  type CustomerIndustry,
  type DealRegistrationFormData,
  type ProjectStage,
  type SalicruProduct,
  type SupportNeed,
} from "@/lib/deal-registration-types";
import { fillDealRegistrationPdfBlob } from "@/lib/fill-deal-registration-pdf";
import {
  getClientDealLink,
  getDealFormDraft,
  isDealLinkExpired,
  markDealLinkOpened,
  saveDealFormDraft,
  submitDealFormViaLink,
} from "@/lib/storage";
import type { DealRegistration } from "@/lib/types";

const INDUSTRY_OPTIONS: { value: CustomerIndustry; label: string }[] = [
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "government", label: "Government" },
  { value: "healthcare", label: "Healthcare" },
  { value: "other", label: "Other" },
];

const STAGE_OPTIONS: { value: ProjectStage; label: string }[] = [
  { value: "leadIdentified", label: "Lead Identified" },
  { value: "inDiscussion", label: "In Discussion" },
  { value: "proposalSubmitted", label: "Proposal Submitted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "purchaseOrderExpected", label: "Purchase Order Expected" },
];

const PRODUCT_OPTIONS: { value: SalicruProduct; label: string }[] = [
  { value: "slcAdapt", label: "SLC ADAPT" },
  { value: "slcTwinPro", label: "SLC TWIN PRO" },
  { value: "slcCube4", label: "SLC CUBE4" },
  { value: "other", label: "Other" },
];

const BATTERY_OPTIONS: { value: BatteryType; label: string }[] = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "niCd", label: "Ni-Cd" },
  { value: "lithiumIon", label: "Lithium-ion" },
  { value: "vrla", label: "VRLA" },
];

const SUPPORT_OPTIONS: { value: SupportNeed; label: string }[] = [
  { value: "techPresentation", label: "Tech Presentation" },
  { value: "siteVisit", label: "Site Visit" },
  { value: "pricing", label: "Pricing" },
  { value: "documentation", label: "Documentation" },
  { value: "others", label: "Others" },
];

function toggleIn<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function ChoiceChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
        active
          ? "bg-[#F7931E]/15 border-[#F7931E]/50 text-[#0B1F3A]"
          : "bg-[#F8F9FC] border-[#0B1F3A]/10 text-[#64748B] hover:border-[#0B1F3A]/25",
      )}
    >
      <span className={cn(
        "w-3.5 h-3.5 rounded border flex items-center justify-center",
        active ? "bg-[#F7931E] border-[#F7931E] text-white" : "border-[#94A3B8] bg-white",
      )}>
        {active && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}>
        <Icon className="w-4 h-4 text-[#F7931E]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">{children}</div>
    </div>
  );
}

export function ClientDealFormPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<DealRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<DealRegistrationFormData>(defaultDealRegistrationForm);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const row = await getClientDealLink(token);
        if (!alive) return;
        if (isDealLinkExpired(row) || row.status === "expired") {
          navigate("/client/expired");
          return;
        }
        if (row.submittedAt) {
          setDeal(row);
          setDone(true);
          setLoading(false);
          return;
        }
        const draft = await getDealFormDraft(token);
        if (!alive) return;
        const base = defaultDealRegistrationForm();
        setForm({
          ...base,
          ...(draft ?? {}),
          partnerCompanyName: draft?.partnerCompanyName || row.partnerCompanyName || "",
          contactPerson: draft?.contactPerson || row.contactPerson || "",
          emailAddress: draft?.emailAddress || row.email || "",
        });
        setDeal(row);
        setLoading(false);
        await markDealLinkOpened(token);
      } catch {
        if (alive) {
          setDeal(null);
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [token, navigate]);

  function patch(partial: Partial<DealRegistrationFormData>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  function validate(): string | null {
    if (!form.partnerCompanyName.trim()) return "Partner company name is required.";
    if (!form.contactPerson.trim()) return "Contact person is required.";
    if (!form.emailAddress.trim()) return "Email address is required.";
    if (!form.endCustomerName.trim()) return "End customer name is required.";
    return null;
  }

  async function saveDraft() {
    if (!token) return;
    setSavingDraft(true);
    setSubmitError("");
    try {
      await saveDealFormDraft(token, form);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await fillDealRegistrationPdfBlob(form);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deal-registration-${form.partnerCompanyName || "form"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function requestSubmit() {
    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError("");
    setShowConfirm(true);
  }

  async function confirmSubmit() {
    if (!token) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitDealFormViaLink(token, form);
      setShowConfirm(false);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit deal registration");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <p className="text-[#64748B]">Loading deal form…</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <p className="text-[#64748B]">Invalid or expired deal registration link.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
        <header
          className="border-b border-white/10 px-4 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}
        >
          <Logo light />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#0B1F3A]/8 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#0B1F3A]">Deal submitted</h1>
            <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
              Thank you. Your deal registration for <strong>{deal.partnerCompanyName}</strong> has been received and is pending review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-[#F4F6FA] flex flex-col overflow-hidden">
      <header
        className="flex-shrink-0 z-20 border-b border-white/10 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #162d52)` }}
      >
        <Logo light />
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {deal.expiresAt && (
            <CountdownTimer
              expiresAt={deal.expiresAt}
              onExpired={() => navigate("/client/expired")}
            />
          )}
          <Button variant="outline" icon={<Save className="w-4 h-4" />} onClick={saveDraft} disabled={savingDraft}>
            {savingDraft ? "Saving…" : "Save Draft"}
          </Button>
          <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={downloadPdf} disabled={downloading}>
            {downloading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button
            variant="gold"
            icon={submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            onClick={requestSubmit}
            disabled={submitting}
          >
            Submit
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 w-full max-w-[1400px] mx-auto">
        <div className="flex-shrink-0 mb-3">
          <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#0B1F3A]">Deal Registration Form</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Complete the form for <strong>{deal.partnerCompanyName}</strong> — no login required
          </p>
        </div>

        {submitError && (
          <div className="flex-shrink-0 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="flex-1 min-h-0 grid xl:grid-cols-2 gap-3 xl:gap-4 items-stretch w-full">
          <div className="min-w-0 w-full h-full min-h-0 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            <SectionCard icon={Building2} title="Submitted by">
              <FormField label="Form Date" half>
                <Input type="date" value={form.formDate} onChange={v => patch({ formDate: v })} />
              </FormField>
              <FormField label="Partner Company Name" required half>
                <Input value={form.partnerCompanyName} onChange={v => patch({ partnerCompanyName: v })} placeholder="Partner company" />
              </FormField>
              <FormField label="Contact Person" required half>
                <Input value={form.contactPerson} onChange={v => patch({ contactPerson: v })} placeholder="Full name" />
              </FormField>
              <FormField label="Designation" half>
                <Input value={form.designation} onChange={v => patch({ designation: v })} placeholder="Job title" />
              </FormField>
              <FormField label="Phone Number" half>
                <Input value={form.phoneNumber} onChange={v => patch({ phoneNumber: v })} placeholder="+971…" />
              </FormField>
              <FormField label="Email Address" half>
                <Input type="email" value={form.emailAddress} onChange={v => patch({ emailAddress: v })} placeholder="name@company.com" />
              </FormField>
            </SectionCard>

            <SectionCard icon={Briefcase} title="Opportunity Details">
              <FormField label="End Customer Name" required>
                <Input value={form.endCustomerName} onChange={v => patch({ endCustomerName: v })} placeholder="Customer company" />
              </FormField>
              <FormField label="Customer Industry">
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.customerIndustry === opt.value}
                      onClick={() => patch({ customerIndustry: form.customerIndustry === opt.value ? "" : opt.value })}
                    />
                  ))}
                </div>
              </FormField>
              {form.customerIndustry === "other" && (
                <FormField label="Other Industry">
                  <Input value={form.customerIndustryOther} onChange={v => patch({ customerIndustryOther: v })} placeholder="Specify industry" />
                </FormField>
              )}
              <FormField label="Project Name / Reference" half>
                <Input value={form.projectName} onChange={v => patch({ projectName: v })} placeholder="Project reference" />
              </FormField>
              <FormField label="Project Location (City/Country)" half>
                <Input value={form.projectLocation} onChange={v => patch({ projectLocation: v })} placeholder="Dubai, UAE" />
              </FormField>
              <FormField label="Estimated Project Value (USD)" half>
                <Input value={form.estimatedValueUsd} onChange={v => patch({ estimatedValueUsd: v })} placeholder="e.g. 150000" />
              </FormField>
              <FormField label="Expected Closing Date" half>
                <Input type="date" value={form.expectedClosingDate} onChange={v => patch({ expectedClosingDate: v })} />
              </FormField>
              <FormField label="Current Project Stage">
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.projectStage === opt.value}
                      onClick={() => patch({ projectStage: form.projectStage === opt.value ? "" : opt.value })}
                    />
                  ))}
                </div>
              </FormField>
            </SectionCard>

            <SectionCard icon={Package} title="Solution Details">
              <FormField label="Salicru Product(s) Proposed">
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_OPTIONS.map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.products.includes(opt.value)}
                      onClick={() => patch({ products: toggleIn(form.products, opt.value) })}
                    />
                  ))}
                </div>
              </FormField>
              {form.products.includes("other") && (
                <FormField label="Other Product">
                  <Input value={form.productOther} onChange={v => patch({ productOther: v })} placeholder="Specify product" />
                </FormField>
              )}
              <FormField label="Required Capacity (kVA/kW)" half>
                <Input value={form.requiredCapacity} onChange={v => patch({ requiredCapacity: v })} placeholder="e.g. 40 kVA" />
              </FormField>
              <FormField label="Runtime Required (minutes)" half>
                <Input value={form.runtimeMinutes} onChange={v => patch({ runtimeMinutes: v })} placeholder="e.g. 30" />
              </FormField>
              <FormField label="Number of Units" half>
                <Input value={form.numberOfUnits} onChange={v => patch({ numberOfUnits: v })} placeholder="e.g. 2" />
              </FormField>
              <FormField label="Battery Type">
                <div className="flex flex-wrap gap-2">
                  {BATTERY_OPTIONS.map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.batteryTypes.includes(opt.value)}
                      onClick={() => patch({ batteryTypes: toggleIn(form.batteryTypes, opt.value) })}
                    />
                  ))}
                </div>
              </FormField>
              <FormField label="Accessories or Add-ons">
                <Input value={form.accessories} onChange={v => patch({ accessories: v })} placeholder="Optional accessories" />
              </FormField>
            </SectionCard>

            <SectionCard icon={Swords} title="Competitive Landscape">
              <FormField label="Other Brands Being Considered">
                <Input value={form.otherBrands} onChange={v => patch({ otherBrands: v })} placeholder="Competitor brands" />
              </FormField>
              <FormField label="Salicru Unique Advantage in this Deal">
                <Textarea value={form.uniqueAdvantage} onChange={v => patch({ uniqueAdvantage: v })} placeholder="Why Salicru wins this deal" rows={2} />
              </FormField>
            </SectionCard>

            <SectionCard icon={ClipboardList} title="Registration Details">
              <FormField label="Registered with another vendor?">
                <div className="flex flex-wrap gap-2">
                  {(["yes", "no"] as const).map(v => (
                    <ChoiceChip
                      key={v}
                      label={v === "yes" ? "Yes" : "No"}
                      active={form.registeredWithOtherVendor === v}
                      onClick={() => patch({ registeredWithOtherVendor: form.registeredWithOtherVendor === v ? "" : v })}
                    />
                  ))}
                </div>
              </FormField>
              <FormField label="Additional Support Required">
                <div className="flex flex-wrap gap-2">
                  {SUPPORT_OPTIONS.map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.supportNeeds.includes(opt.value)}
                      onClick={() => patch({ supportNeeds: toggleIn(form.supportNeeds, opt.value) })}
                    />
                  ))}
                </div>
              </FormField>
            </SectionCard>

            <SectionCard icon={PenLine} title="Partner Declaration">
              <FormField label="Authorized Partner Signature">
                <SignaturePad value={form.partnerSignature} onChange={v => patch({ partnerSignature: v })} />
              </FormField>
              <FormField label="Signature Date" half>
                <Input type="date" value={form.partnerSignatureDate} onChange={v => patch({ partnerSignatureDate: v })} />
              </FormField>
            </SectionCard>
          </div>

          <LiveDealDocumentPanel data={form} fill />
        </div>

        <LiveDealDocumentPanelMobile data={form} />
      </div>

      <Modal
        open={showConfirm}
        onClose={() => !submitting && setShowConfirm(false)}
        wide
        title="Submit Deal Registration"
        subtitle="This will send the deal for AHamson / Salicru review"
      >
        <div className="-mx-4 sm:-mx-5 -mt-4 sm:-mt-5 max-h-[62vh] overflow-y-auto bg-[#DDE2E8] p-1.5 scrollbar-thin">
          <DealPdfPreview data={form} />
        </div>
        <div className="-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-[#0B1F3A]/8 bg-[#F8F9FC] flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[#64748B] text-xs flex-1 min-w-[200px]">
            After submit, the deal appears on the admin dashboard as <strong>Pending</strong>.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" disabled={submitting} onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button
              variant="gold"
              disabled={submitting}
              icon={submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              onClick={confirmSubmit}
            >
              {submitting ? "Submitting…" : "Yes, Submit Deal"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
