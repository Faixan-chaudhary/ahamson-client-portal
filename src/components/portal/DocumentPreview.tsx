import { Building2, User, PenLine, CreditCard, FileText, Shield } from "lucide-react";
import type { DocumentFormData } from "@/lib/types";
import { DOCUMENT_CHECKLIST_ITEMS } from "@/lib/constants";
import { Card, CardHeader, PreviewRow } from "./Card";

export function DocumentPreview({ data }: { data: DocumentFormData }) {
  return (
    <div className="space-y-4 font-['Inter']">
      <Card>
        <CardHeader title="A) Company Information" icon={Building2} />
        <PreviewRow label="Legal Name" value={data.legalName} />
        <PreviewRow label="P.O. Box" value={data.poBox} />
        <PreviewRow label="Emirate" value={data.emirate} />
        <PreviewRow label="Telephone" value={data.telephone} />
        <PreviewRow label="Email" value={data.email} />
        <PreviewRow label="Business Nature" value={data.businessNature} />
        <PreviewRow label="Legal Status" value={data.legalStatus} />
        <PreviewRow label="Trade License No." value={data.tradeLicenseNumber} />
        <PreviewRow label="Trade License Expiry" value={data.tradeLicenseExpiry} />
        <PreviewRow label="Period in UAE" value={data.periodInUae} />
        <PreviewRow label="City" value={data.city} />
        <PreviewRow label="Area" value={data.area} />
        <PreviewRow label="Street" value={data.street} />
        <PreviewRow label="Building / Villa No." value={data.buildingNumber} />
        <PreviewRow label="Office" value={data.office} />
        <PreviewRow label="Nearest Landmark" value={data.nearestLandmark} />
        <PreviewRow label="Owner Name" value={data.ownerName} />
        <PreviewRow label="Owner Nationality" value={data.ownerNationality} />
        <PreviewRow label="Owner Position" value={data.ownerPosition} />
        <PreviewRow label="Partner Name" value={data.partnerName} />
        <PreviewRow label="Partner Nationality" value={data.partnerNationality} />
        <PreviewRow label="Partner Position" value={data.partnerPosition} />
        <PreviewRow label="GM Name" value={data.gmName} />
        <PreviewRow label="GM Nationality" value={data.gmNationality} />
        <PreviewRow label="GM Position" value={data.gmPosition} />
      </Card>

      <Card>
        <CardHeader title="B) Authorized Person to Sign LPO" icon={PenLine} />
        {data.lpoSignatories.map((p, i) => (
          <div key={i}>
            <PreviewRow label={`Person ${i + 1} — Name`} value={p.name} />
            <PreviewRow label="Position" value={p.position} />
            {p.signature && (
              <div className="px-5 py-3 border-b border-[#0B1F3A]/5">
                <p className="text-xs text-[#94A3B8] mb-2">Digital Signature</p>
                <img src={p.signature} alt="LPO Signature" className="h-14 object-contain bg-[#F8F9FC] rounded-lg p-2" />
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="C) Authorized Person to Sign Cheques" icon={PenLine} />
        {data.chequeSignatories.map((p, i) => (
          <div key={i}>
            <PreviewRow label={`Person ${i + 1} — Name`} value={p.name} />
            <PreviewRow label="Position" value={p.position} />
            {p.signature && (
              <div className="px-5 py-3 border-b border-[#0B1F3A]/5">
                <p className="text-xs text-[#94A3B8] mb-2">Digital Signature</p>
                <img src={p.signature} alt="Cheque Signature" className="h-14 object-contain bg-[#F8F9FC] rounded-lg p-2" />
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="D) Bank References" icon={CreditCard} />
        {data.bankReferences.map((b, i) => (
          <div key={i}>
            <PreviewRow label={`Bank ${i + 1} — Branch`} value={b.bankBranch} />
            <PreviewRow label="IBAN" value={b.iban} />
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="E) Trade Credit References" icon={User} />
        {data.tradeCreditReferences.map((t, i) => (
          <div key={i}>
            <PreviewRow label={`Company ${i + 1}`} value={t.companyName} />
            <PreviewRow label="Telephone" value={t.telephone} />
            <PreviewRow label="Mobile" value={t.mobile} />
            <PreviewRow label="Email" value={t.email} />
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="F) Documents Checklist" icon={FileText} />
        {DOCUMENT_CHECKLIST_ITEMS.map(d => (
          <PreviewRow key={d.key} label={d.label} value={data.documents[d.key] ? `✓ ${data.documents[d.key]}` : "Not uploaded"} />
        ))}
      </Card>

      <Card>
        <CardHeader title="G) Declaration & Credit Information" icon={Shield} />
        <PreviewRow label="Agreement Confirmed" value={data.agreementConfirmed ? "Yes" : "No"} />
        <PreviewRow label="Max Credit Limit" value={data.maxCreditLimit} />
        <PreviewRow label="Credit Period (days)" value={data.creditPeriodDays} />
        <PreviewRow label="Authorized Person" value={data.authorizedPersonName} />
        <PreviewRow label="Designation" value={data.designation} />
        <PreviewRow label="Date" value={data.declarationDate} />
        {data.declarationSignature && (
          <div className="px-5 py-3 border-b border-[#0B1F3A]/5">
            <p className="text-xs text-[#94A3B8] mb-2">Authorized Signature</p>
            <img src={data.declarationSignature} alt="Declaration Signature" className="h-14 object-contain bg-[#F8F9FC] rounded-lg p-2" />
          </div>
        )}
        {data.companyStamp && (
          <div className="px-5 py-4">
            <p className="text-xs text-[#94A3B8] mb-2">Company Stamp</p>
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#F7931E]/40 flex items-center justify-center text-xs text-[#94A3B8] bg-[#F8F9FC]">
              {data.companyStamp}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
