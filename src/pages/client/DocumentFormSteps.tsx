import type { DocumentFormData } from "@/lib/types";
import { EMIRATES, LEGAL_STATUSES, DOCUMENT_CHECKLIST_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FormField, Input, Textarea } from "@/components/portal/FormField";
import { SignaturePad } from "@/components/portal/SignaturePad";
import { CompanyStampPreview } from "@/components/portal/CompanyStampPreview";
import { FileUpload } from "@/components/portal/FileUpload";
import { Button } from "@/components/portal/Button";
import { Building2, Mail, Phone, MapPin, User, Plus, Trash2, Stamp } from "lucide-react";
import type { FieldErrors } from "react-hook-form";

interface StepProps {
  data: DocumentFormData;
  onChange: (data: DocumentFormData) => void;
  errors: Record<string, string>;
}

function err(errors: Record<string, string> | undefined, path: string): string | undefined {
  if (!errors) return undefined;
  return errors[path];
}

export function CompanyInfoStep({ data, onChange, errors }: StepProps) {
  const set = (k: keyof DocumentFormData, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Legal Name" required error={err(errors, "legalName")}><Input value={data.legalName} onChange={v => set("legalName", v)} icon={<Building2 className="w-4 h-4" />} /></FormField>
      <FormField label="P.O. Box" required half error={err(errors, "poBox")}><Input value={data.poBox} onChange={v => set("poBox", v)} /></FormField>
      <FormField label="Emirate" required half error={err(errors, "emirate")}><Input value={data.emirate} onChange={v => set("emirate", v)} options={EMIRATES} /></FormField>
      <FormField label="Telephone" required half error={err(errors, "telephone")}><Input value={data.telephone} onChange={v => set("telephone", v)} icon={<Phone className="w-4 h-4" />} /></FormField>
      <FormField label="Email" required half error={err(errors, "email")}><Input value={data.email} onChange={v => set("email", v)} type="email" icon={<Mail className="w-4 h-4" />} /></FormField>
      <FormField label="Business Nature" required half error={err(errors, "businessNature")}><Input value={data.businessNature} onChange={v => set("businessNature", v)} /></FormField>
      <FormField label="Legal Status" required half error={err(errors, "legalStatus")}><Input value={data.legalStatus} onChange={v => set("legalStatus", v)} options={LEGAL_STATUSES} /></FormField>
      <FormField label="Trade License Number" required half error={err(errors, "tradeLicenseNumber")}><Input value={data.tradeLicenseNumber} onChange={v => set("tradeLicenseNumber", v)} /></FormField>
      <FormField label="Trade License Expiry Date" required half error={err(errors, "tradeLicenseExpiry")}><Input value={data.tradeLicenseExpiry} onChange={v => set("tradeLicenseExpiry", v)} type="date" /></FormField>
      <FormField label="Period of Business in UAE" required half error={err(errors, "periodInUae")}><Input value={data.periodInUae} onChange={v => set("periodInUae", v)} /></FormField>
      <FormField label="TRN No." half><Input value={data.trnNumber} onChange={v => set("trnNumber", v)} placeholder="Tax Registration Number" /></FormField>
      <FormField label="Makani / Building / Villa #" half><Input value={data.makaniNumber} onChange={v => set("makaniNumber", v)} placeholder="Makani number" /></FormField>
      <FormField label="City" required half error={err(errors, "city")}><Input value={data.city} onChange={v => set("city", v)} icon={<MapPin className="w-4 h-4" />} /></FormField>
      <FormField label="Area" required half error={err(errors, "area")}><Input value={data.area} onChange={v => set("area", v)} /></FormField>
      <FormField label="Street" required half error={err(errors, "street")}><Input value={data.street} onChange={v => set("street", v)} /></FormField>
      <FormField label="Building / Villa Number" required half error={err(errors, "buildingNumber")}><Input value={data.buildingNumber} onChange={v => set("buildingNumber", v)} /></FormField>
      <FormField label="Office" half><Input value={data.office} onChange={v => set("office", v)} /></FormField>
      <FormField label="Nearest Landmark" half><Input value={data.nearestLandmark} onChange={v => set("nearestLandmark", v)} /></FormField>
      <FormField label="Owner Name" required half error={err(errors, "ownerName")}><Input value={data.ownerName} onChange={v => set("ownerName", v)} icon={<User className="w-4 h-4" />} /></FormField>
      <FormField label="Owner Nationality" required half error={err(errors, "ownerNationality")}><Input value={data.ownerNationality} onChange={v => set("ownerNationality", v)} /></FormField>
      <FormField label="Owner Position" required half error={err(errors, "ownerPosition")}><Input value={data.ownerPosition} onChange={v => set("ownerPosition", v)} /></FormField>
      <FormField label="Partner Name" half><Input value={data.partnerName} onChange={v => set("partnerName", v)} /></FormField>
      <FormField label="Partner Nationality" half><Input value={data.partnerNationality} onChange={v => set("partnerNationality", v)} /></FormField>
      <FormField label="Partner Position" half><Input value={data.partnerPosition} onChange={v => set("partnerPosition", v)} /></FormField>
      <FormField label="GM Name" required half error={err(errors, "gmName")}><Input value={data.gmName} onChange={v => set("gmName", v)} /></FormField>
      <FormField label="GM Nationality" required half error={err(errors, "gmNationality")}><Input value={data.gmNationality} onChange={v => set("gmNationality", v)} /></FormField>
      <FormField label="GM Position" required half error={err(errors, "gmPosition")}><Input value={data.gmPosition} onChange={v => set("gmPosition", v)} /></FormField>
    </div>
  );
}

export function SignatoriesStep({ data, onChange, field, title, errors }: StepProps & { field: "lpoSignatories" | "chequeSignatories"; title: string }) {
  const persons = data[field];
  const update = (i: number, k: "name" | "position" | "signature", v: string) => {
    const next = [...persons];
    next[i] = { ...next[i], [k]: v };
    onChange({ ...data, [field]: next });
  };
  const add = () => { if (persons.length < 2) onChange({ ...data, [field]: [...persons, { name: "", position: "", signature: "" }] }); };
  const remove = (i: number) => onChange({ ...data, [field]: persons.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#64748B]">{title} — up to 2 persons</p>
      {persons.map((p, i) => (
        <div key={i} className="p-4 rounded-2xl border border-[#0B1F3A]/10 bg-[#F8F9FC] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">Person {i + 1}</p>
            {persons.length > 1 && <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name" required half error={err(errors, `${field}.${i}.name`)}><Input value={p.name} onChange={v => update(i, "name", v)} /></FormField>
            <FormField label="Position" required half error={err(errors, `${field}.${i}.position`)}><Input value={p.position} onChange={v => update(i, "position", v)} /></FormField>
          </div>
          <FormField label="Digital Signature" required error={err(errors, `${field}.${i}.signature`)}>
            <SignaturePad value={p.signature} onChange={v => update(i, "signature", v)} />
          </FormField>
        </div>
      ))}
      {persons.length < 2 && (
        <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={add}>Add Person</Button>
      )}
    </div>
  );
}

export function BankReferencesStep({ data, onChange, errors }: StepProps) {
  const rows = data.bankReferences;
  const update = (i: number, k: "bankBranch" | "iban", v: string) => {
    const next = [...rows]; next[i] = { ...next[i], [k]: v };
    onChange({ ...data, bankReferences: next });
  };
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-[#0B1F3A]/10">
          <FormField label="Bank & Branch" required half error={err(errors, `bankReferences.${i}.bankBranch`)}><Input value={r.bankBranch} onChange={v => update(i, "bankBranch", v)} /></FormField>
          <FormField label="IBAN" required half error={err(errors, `bankReferences.${i}.iban`)}><Input value={r.iban} onChange={v => update(i, "iban", v)} /></FormField>
          {rows.length > 1 && <button onClick={() => onChange({ ...data, bankReferences: rows.filter((_, j) => j !== i) })} className="sm:col-span-2 text-xs text-red-500 flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove row</button>}
        </div>
      ))}
      <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={() => onChange({ ...data, bankReferences: [...rows, { bankBranch: "", iban: "" }] })}>Add Row</Button>
    </div>
  );
}

export function TradeCreditStep({ data, onChange, errors }: StepProps) {
  const rows = data.tradeCreditReferences;
  const update = (i: number, k: keyof typeof rows[0], v: string) => {
    const next = [...rows]; next[i] = { ...next[i], [k]: v };
    onChange({ ...data, tradeCreditReferences: next });
  };
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-[#0B1F3A]/10">
          <FormField label="Company Name" required error={err(errors, `tradeCreditReferences.${i}.companyName`)}><Input value={r.companyName} onChange={v => update(i, "companyName", v)} /></FormField>
          <FormField label="Telephone" required half error={err(errors, `tradeCreditReferences.${i}.telephone`)}><Input value={r.telephone} onChange={v => update(i, "telephone", v)} /></FormField>
          <FormField label="Mobile" required half error={err(errors, `tradeCreditReferences.${i}.mobile`)}><Input value={r.mobile} onChange={v => update(i, "mobile", v)} /></FormField>
          <FormField label="Email" required half error={err(errors, `tradeCreditReferences.${i}.email`)}><Input value={r.email} onChange={v => update(i, "email", v)} type="email" /></FormField>
          {rows.length > 1 && <button onClick={() => onChange({ ...data, tradeCreditReferences: rows.filter((_, j) => j !== i) })} className="sm:col-span-2 text-xs text-red-500 flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove row</button>}
        </div>
      ))}
      <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={() => onChange({ ...data, tradeCreditReferences: [...rows, { companyName: "", telephone: "", mobile: "", email: "" }] })}>Add Row</Button>
    </div>
  );
}

export function DocumentsStep({ data, onChange, errors }: StepProps) {
  const setDoc = (key: string, name: string | null) => {
    onChange({ ...data, documents: { ...data.documents, [key]: name } });
  };
  const missingRequired = DOCUMENT_CHECKLIST_ITEMS.filter(
    d => d.required && !data.documents[d.key],
  );
  return (
    <div className="space-y-3">
      {missingRequired.length > 0 && err(errors, `documents.${missingRequired[0].key}`) && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Please upload all required documents marked with * before continuing.
        </p>
      )}
      {DOCUMENT_CHECKLIST_ITEMS.map(d => (
        <FileUpload key={d.key} label={d.label} required={d.required}
          fileName={data.documents[d.key]}
          onChange={name => setDoc(d.key, name)}
          error={err(errors, `documents.${d.key}`)} />
      ))}
    </div>
  );
}

export function DeclarationStep({ data, onChange, errors }: StepProps) {
  const set = (k: keyof DocumentFormData, v: string | boolean | null) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <label className={cn(
          "flex items-start gap-3 p-4 rounded-xl border cursor-pointer",
          err(errors, "agreementConfirmed") ? "border-red-500" : "border-[#0B1F3A]/10"
        )}>
        <span className="relative mt-0.5 inline-flex h-4 w-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={data.agreementConfirmed}
            onChange={e => set("agreementConfirmed", e.target.checked)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <span className={cn(
            "pointer-events-none flex h-4 w-4 items-center justify-center rounded border transition-colors",
            data.agreementConfirmed
              ? "border-[#F7931E] bg-[#F7931E]"
              : "border-[#0B1F3A]/25 bg-white",
          )}>
            {data.agreementConfirmed && (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                <path d="M2 6.2L4.7 9 10 3.2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </span>
        <span className="text-sm text-[#64748B]">I confirm the information provided is accurate and agree to the terms and conditions. <span className="text-[#F7931E]">*</span></span>
      </label>
      {err(errors, "agreementConfirmed") && <p className="text-red-500 text-xs mt-1">{err(errors, "agreementConfirmed")}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Maximum Credit Limit Required" required half error={err(errors, "maxCreditLimit")}><Input value={data.maxCreditLimit} onChange={v => set("maxCreditLimit", v)} /></FormField>
        <FormField label="Credit Period Required (days)" required half error={err(errors, "creditPeriodDays")}><Input value={data.creditPeriodDays} onChange={v => set("creditPeriodDays", v)} type="number" /></FormField>
        <FormField label="Authorized Person Name" required half error={err(errors, "authorizedPersonName")}><Input value={data.authorizedPersonName} onChange={v => set("authorizedPersonName", v)} /></FormField>
        <FormField label="Designation" required half error={err(errors, "designation")}><Input value={data.designation} onChange={v => set("designation", v)} /></FormField>
        <FormField label="Date" required half error={err(errors, "declarationDate")}><Input value={data.declarationDate} onChange={v => set("declarationDate", v)} type="date" /></FormField>
      </div>
      <FormField label="Authorized Signature" required error={err(errors, "declarationSignature")}>
        <SignaturePad value={data.declarationSignature} onChange={v => set("declarationSignature", v)} />
      </FormField>
      <FormField label="Company Stamp Upload">
        <div className="space-y-2">
          <label className={cn(
            "relative flex flex-col items-center justify-center gap-2 min-h-28 overflow-hidden rounded-2xl border-2 border-dashed bg-[#F8F9FC] cursor-pointer hover:border-[#F7931E]/50 transition-colors px-4 py-5",
            err(errors, "companyStamp") ? "border-red-500" : "border-[#F7931E]/30",
          )}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) {
                  set("companyStamp", null);
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  set("companyStamp", null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => set("companyStamp", String(reader.result ?? ""));
                reader.readAsDataURL(file);
              }}
            />
            {data.companyStamp ? (
              <>
                <CompanyStampPreview src={data.companyStamp} size="lg" />
                <span className="text-[11px] font-medium text-[#64748B]">Click to replace stamp image</span>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7931E]/10 ring-1 ring-[#F7931E]/20">
                  <Stamp className="h-5 w-5 text-[#F7931E]" strokeWidth={1.75} />
                </div>
                <span className="text-sm text-[#94A3B8]">Click to upload company stamp</span>
                <span className="text-[11px] text-[#94A3B8]">PNG, JPG or WEBP</span>
              </>
            )}
          </label>
          {data.companyStamp && (
            <button
              type="button"
              onClick={() => set("companyStamp", null)}
              className="text-xs font-medium text-[#64748B] hover:text-red-600 transition-colors"
            >
              Remove stamp
            </button>
          )}
        </div>
        {err(errors, "companyStamp") && <p className="text-red-500 text-xs mt-1">{err(errors, "companyStamp")}</p>}
      </FormField>
    </div>
  );
}
