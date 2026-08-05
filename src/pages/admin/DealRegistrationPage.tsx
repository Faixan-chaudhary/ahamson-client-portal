import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Building2, Briefcase, Package, Swords, ClipboardList,
  PenLine, Shield, Download, Check, CheckCircle, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { FormField, Input, Textarea } from "@/components/portal/FormField";
import { SignaturePad } from "@/components/portal/SignaturePad";
import { Modal } from "@/components/portal/Modal";
import { LiveDealDocumentPanel, LiveDealDocumentPanelMobile } from "@/components/portal/LiveDealDocumentPanel";
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
import { submitDealRegistration } from "@/lib/storage";
import { DealPdfPreview } from "@/components/portal/DealPdfPreview";

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

function ChoiceChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
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
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {children}
      </div>
    </div>
  );
}

export function DealRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<DealRegistrationFormData>(defaultDealRegistrationForm);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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
    setSubmitting(true);
    setSubmitError("");
    try {
      const saved = await submitDealRegistration(form);
      setShowConfirm(false);
      navigate(`/admin/deals/${saved.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit deal registration");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Deal Registration Form"
        subtitle="Fill the partner deal form — preview updates live on the right"
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate("/admin/dashboard")}>
            Back
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
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full">
        {submitError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
        <div className="grid xl:grid-cols-2 gap-3 xl:gap-4 items-start w-full">
          <div className="min-w-0 w-full space-y-3 xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto xl:pr-1 scrollbar-thin">
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

            <SectionCard icon={Shield} title="For Salicru DWC LLC Use Only">
              <FormField label="Deal ID" half>
                <Input value={form.dealId} onChange={v => patch({ dealId: v })} placeholder="Internal deal ID" />
              </FormField>
              <FormField label="Registered By" half>
                <Input value={form.registeredBy} onChange={v => patch({ registeredBy: v })} placeholder="Salicru representative" />
              </FormField>
              <FormField label="Date of Registration" half>
                <Input type="date" value={form.registrationDate} onChange={v => patch({ registrationDate: v })} />
              </FormField>
              <FormField label="Approval Status">
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "rejected", label: "Rejected" },
                  ] as const).map(opt => (
                    <ChoiceChip
                      key={opt.value}
                      label={opt.label}
                      active={form.approvalStatus === opt.value}
                      onClick={() => patch({ approvalStatus: form.approvalStatus === opt.value ? "" : opt.value })}
                    />
                  ))}
                </div>
              </FormField>
              <FormField label="Remarks">
                <Textarea value={form.remarks} onChange={v => patch({ remarks: v })} placeholder="Internal remarks" rows={2} />
              </FormField>
            </SectionCard>
          </div>

          <LiveDealDocumentPanel data={form} />
        </div>

        <LiveDealDocumentPanelMobile data={form} />
      </div>

      <Modal
        open={showConfirm}
        onClose={() => !submitting && setShowConfirm(false)}
        wide
        title="Submit Deal Registration"
        subtitle="This will save the deal for AHamson and Salicru review"
      >
        {/* Edge-to-edge preview — cancel the modal body padding */}
        <div className="-mx-4 sm:-mx-5 -mt-4 sm:-mt-5 max-h-[62vh] overflow-y-auto bg-[#DDE2E8] p-1.5 scrollbar-thin">
          <DealPdfPreview data={form} />
        </div>
        <div className="-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 border-t border-[#0B1F3A]/8 bg-[#F8F9FC] flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[#64748B] text-xs flex-1 min-w-[200px]">
            Deal will appear on the dashboard as <strong>Pending</strong> until Salicru approves or rejects it.
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
    </>
  );
}
