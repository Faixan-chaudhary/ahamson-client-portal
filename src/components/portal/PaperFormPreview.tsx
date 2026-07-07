import { useMemo } from "react";
import { Shield } from "lucide-react";
import type { DocumentFormData } from "@/lib/types";
import { DOCUMENT_CHECKLIST_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ORANGE = "#C8872E";
const FIELD_BG = "#E4EAF0";
const DOC_REF = "AHS/CRF/FRM-001 Rev No:01";

interface PaperFormPreviewProps {
  data: DocumentFormData;
  companyName?: string;
  page?: 1 | 2 | "both";
  className?: string;
  compact?: boolean;
  activeSection?: number;
}

function Cell({
  label, value, sublabel, className, filled, colSpan,
}: {
  label: string; value?: string | null; sublabel?: string;
  className?: string; filled?: boolean; colSpan?: string;
}) {
  const hasValue = !!value?.trim();
  return (
    <div className={cn("border border-black/70 flex flex-col min-w-0", colSpan, className)}>
      <div className="px-1 py-0.5 text-[7px] sm:text-[8px] font-bold text-white leading-tight" style={{ background: ORANGE }}>
        {label}
        {sublabel && <span className="block font-normal text-[6px] sm:text-[7px] opacity-90">{sublabel}</span>}
      </div>
      <div className={cn(
        "flex-1 px-1 py-0.5 text-[8px] sm:text-[9px] text-[#111] min-h-[20px] sm:min-h-[22px] break-words transition-all duration-700",
        hasValue ? "font-semibold bg-white" : "",
        !hasValue && "text-transparent",
        filled && hasValue && "animate-[pulse-once_0.6s_ease-out] shadow-[inset_0_0_0_1px_#10B98140]",
      )} style={{ background: hasValue ? "#fff" : FIELD_BG }}>
        {hasValue ? value : "—"}
      </div>
    </div>
  );
}

function SignCell({ label, signature }: { label: string; signature?: string }) {
  return (
    <div className="border border-black/70 flex flex-col flex-1 min-w-0">
      <div className="px-1 py-0.5 text-[7px] font-bold text-white" style={{ background: ORANGE }}>{label}</div>
      <div className="flex-1 min-h-[28px] sm:min-h-[32px] flex items-center justify-center p-0.5" style={{ background: FIELD_BG }}>
        {signature ? (
          <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
        ) : (
          <span className="text-[7px] text-[#94A3B8] italic">Sign here</span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full px-2 py-1 text-[8px] sm:text-[9px] font-bold text-white border border-black/70" style={{ background: ORANGE }}>
      {children}
    </div>
  );
}

function Watermark() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <Shield className="w-[55%] h-[55%] text-[#0B1F3A] opacity-[0.04]" strokeWidth={0.5} />
    </div>
  );
}

function Page1({ data, companyName, activeSection }: { data: DocumentFormData; companyName?: string; activeSection?: number }) {
  const displayName = data.legalName || companyName || "YOUR COMPANY NAME L.L.C.";
  const filled = (n: number) => activeSection === n;

  const checklist = useMemo(() =>
    DOCUMENT_CHECKLIST_ITEMS.map(d => ({
      ...d,
      checked: !!data.documents[d.key],
      name: data.documents[d.key],
    })), [data.documents]);

  return (
    <div className="relative bg-white shadow-2xl border border-black/20" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Watermark />
      <div className="relative p-3 sm:p-4 space-y-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border-2 border-[#0B1F3A]/20 bg-[#0B1F3A]">
              <Shield className="w-6 h-6 text-[#F7931E]" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-[#0B1F3A] leading-tight tracking-wide">{displayName.toUpperCase()}</p>
              <p className="text-[7px] text-[#64748B]">Client Registration</p>
            </div>
          </div>
          <div className="border border-black/70 text-[7px] sm:text-[8px]">
            <div className="grid grid-cols-2">
              <div className="px-2 py-0.5 font-bold border-r border-black/50" style={{ background: ORANGE, color: "white" }}>Code</div>
              <div className="px-2 py-0.5 font-bold" style={{ background: ORANGE, color: "white" }}>Date</div>
              <div className="px-2 py-1 border-r border-black/30 bg-white col-span-1">{data.declarationDate || " "}</div>
              <div className="px-2 py-1 bg-white">{new Date().toLocaleDateString("en-GB")}</div>
            </div>
          </div>
        </div>

        <h1 className="text-center text-[11px] sm:text-[13px] font-black underline decoration-2 underline-offset-4 mb-3 tracking-wide">
          CLIENT REGISTRATION FORM
        </h1>

        {/* Section A */}
        <div className={cn("grid grid-cols-12 gap-0 transition-all duration-500 rounded-sm", filled(1) && "ring-2 ring-[#F7931E]/50 ring-offset-2")}>
          <SectionHeader>A) Company Information</SectionHeader>
          <Cell label="Legal Name" value={data.legalName} filled={filled(1)} colSpan="col-span-5" />
          <Cell label="P.O. Box" value={data.poBox} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Emirate" value={data.emirate} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Telephone" value={data.telephone} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="E-mail" value={data.email} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Business Nature" value={data.businessNature} filled={filled(1)} colSpan="col-span-5" />
          <Cell label="Legal Status" value={data.legalStatus} sublabel="Sole Prop./Partnership/LLC/FZCO/FZCE/Others" filled={filled(1)} colSpan="col-span-12" />
          <Cell label="Trade License No." value={data.tradeLicenseNumber} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Expiry Date" value={data.tradeLicenseExpiry} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Period of Business in UAE" value={data.periodInUae} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="TRN No." value={data.trnNumber} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="City" value={data.city} filled={filled(1)} colSpan="col-span-2" />
          <Cell label="Location/Area" value={data.area} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Street" value={data.street} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Building Name/Villa Number" value={data.buildingNumber} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Office" value={data.office} filled={filled(1)} colSpan="col-span-2" />
          <Cell label="Nearest Landmark" value={data.nearestLandmark} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Makani/Building/Villa#" value={data.makaniNumber} filled={filled(1)} colSpan="col-span-6" />
          <Cell label="Owner/Partner Name" value={data.ownerName} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Nationality" value={data.ownerNationality} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Position" value={data.ownerPosition} filled={filled(1)} colSpan="col-span-5" />
          <Cell label="Owner/Partner Name" value={data.partnerName} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Nationality" value={data.partnerNationality} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Position" value={data.partnerPosition} filled={filled(1)} colSpan="col-span-5" />
          <Cell label="GM Name" value={data.gmName} filled={filled(1)} colSpan="col-span-4" />
          <Cell label="Nationality" value={data.gmNationality} filled={filled(1)} colSpan="col-span-3" />
          <Cell label="Position" value={data.gmPosition} filled={filled(1)} colSpan="col-span-5" />
        </div>

        {/* Middle: B-E + Checklist */}
        <div className="grid grid-cols-12 gap-0 mt-0">
          <div className="col-span-8">
            {/* B */}
            <div className={cn("grid grid-cols-8 gap-0 transition-all duration-500", filled(2) && "ring-2 ring-[#F7931E]/50 ring-offset-1")}>
              <SectionHeader>B) Information of the Authorized person to sign LPO</SectionHeader>
              {(data.lpoSignatories.length ? data.lpoSignatories : [{ name: "", position: "", signature: "" }]).slice(0, 2).map((p, i) => (
                <div key={i} className="col-span-8 grid grid-cols-8 gap-0">
                  <Cell label="Name" value={p.name} filled={filled(2)} colSpan="col-span-3" />
                  <Cell label="Position" value={p.position} filled={filled(2)} colSpan="col-span-2" />
                  <div className="col-span-3"><SignCell label="Sign:" signature={p.signature} /></div>
                </div>
              ))}
            </div>
            {/* C */}
            <div className={cn("grid grid-cols-8 gap-0 transition-all duration-500", filled(3) && "ring-2 ring-[#F7931E]/50 ring-offset-1")}>
              <SectionHeader>C) Information of the Authorized person to sign Cheques</SectionHeader>
              {(data.chequeSignatories.length ? data.chequeSignatories : [{ name: "", position: "", signature: "" }]).slice(0, 2).map((p, i) => (
                <div key={i} className="col-span-8 grid grid-cols-8 gap-0">
                  <Cell label="Name" value={p.name} filled={filled(3)} colSpan="col-span-3" />
                  <Cell label="Position" value={p.position} filled={filled(3)} colSpan="col-span-2" />
                  <div className="col-span-3"><SignCell label="Sign:" signature={p.signature} /></div>
                </div>
              ))}
            </div>
            {/* D */}
            <div className={cn("grid grid-cols-6 gap-0 transition-all duration-500", filled(4) && "ring-2 ring-[#F7931E]/50 ring-offset-1")}>
              <SectionHeader>D) Bank References (Name of the banks you are dealing with)</SectionHeader>
              {(data.bankReferences.length ? data.bankReferences : [{ bankBranch: "", iban: "" }]).slice(0, 2).map((b, i) => (
                <div key={i} className="col-span-6 grid grid-cols-6 gap-0">
                  <Cell label="Bank & Branch" value={b.bankBranch} filled={filled(4)} colSpan="col-span-3" />
                  <Cell label="IBAN" value={b.iban} filled={filled(4)} colSpan="col-span-3" />
                </div>
              ))}
            </div>
            {/* E */}
            <div className={cn("grid grid-cols-8 gap-0 transition-all duration-500", filled(5) && "ring-2 ring-[#F7931E]/50 ring-offset-1")}>
              <SectionHeader>E) Trade Credit References (Name of Companies you are dealing with on credit)</SectionHeader>
              {(data.tradeCreditReferences.length ? data.tradeCreditReferences : [{ companyName: "", telephone: "", mobile: "", email: "" }]).slice(0, 2).map((t, i) => (
                <div key={i} className="col-span-8 grid grid-cols-8 gap-0">
                  <Cell label="Company Name" value={t.companyName} filled={filled(5)} colSpan="col-span-3" />
                  <Cell label="Tel" value={t.telephone} filled={filled(5)} colSpan="col-span-2" />
                  <Cell label="Mob" value={t.mobile} filled={filled(5)} colSpan="col-span-1" />
                  <Cell label="Email" value={t.email} filled={filled(5)} colSpan="col-span-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Checklist sidebar */}
          <div className={cn("col-span-4 border border-black/70 flex flex-col transition-all duration-500", filled(6) && "ring-2 ring-[#F7931E]/50")}>
            <div className="px-1 py-1 text-[7px] sm:text-[8px] font-bold text-white text-center" style={{ background: ORANGE }}>
              Check list DOCs Annexed
            </div>
            <div className="flex-1 p-1.5 space-y-0.5 overflow-hidden" style={{ background: FIELD_BG }}>
              {checklist.map((item, i) => (
                <div key={item.key} className={cn("flex items-start gap-1 text-[6px] sm:text-[7px] leading-tight transition-all duration-500",
                  item.checked && "font-bold text-[#0B1F3A]")}>
                  <span className={cn("w-3 h-3 border border-black/60 flex-shrink-0 flex items-center justify-center text-[6px] mt-px transition-colors",
                    item.checked ? "bg-emerald-500 text-white border-emerald-600" : "bg-white")}>
                    {item.checked ? "✓" : i + 1}
                  </span>
                  <span className={item.checked ? "text-[#0B1F3A]" : "text-[#64748B]"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className={cn("border border-black/70 p-2 mt-0 text-[6px] sm:text-[7px] leading-relaxed text-[#333] transition-all duration-500", filled(7) && "ring-2 ring-[#F7931E]/50")}>
          <p className="italic mb-1"><strong>I/WE believe and undertake;</strong> our firm is financially sound and capable of meeting all obligations. We agree to the following terms:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-[6px]">
            <li>All services are subject to AHamson standard terms and conditions.</li>
            <li>Payment terms as agreed upon credit approval.</li>
            <li>Credit limit and period subject to management approval.</li>
            <li>Information provided is true and complete to the best of our knowledge.</li>
            <li>This registration constitutes a legally binding agreement.</li>
          </ol>
          <div className="grid grid-cols-2 gap-0 mt-2 border-t border-black/30 pt-2">
            <Cell label="Maximum Credit Limit Required (AED)" value={data.maxCreditLimit ? `AED ${data.maxCreditLimit}` : ""} filled={filled(7)} />
            <Cell label="Credit Period Required" value={data.creditPeriodDays ? `${data.creditPeriodDays} Days from the date of invoice` : ""} filled={filled(7)} />
          </div>
        </div>

        {/* Footer signatures */}
        <div className="grid grid-cols-12 gap-0 mt-0">
          <div className="col-span-8 grid grid-cols-6 gap-0">
            <SignCell label="Authorized Signature" signature={data.declarationSignature} />
            <Cell label="Date" value={data.declarationDate} colSpan="col-span-1" />
            <Cell label="Name" value={data.authorizedPersonName} colSpan="col-span-2" />
            <Cell label="Designation" value={data.designation} colSpan="col-span-2" />
          </div>
          <div className="col-span-4 border border-black/70 flex flex-col">
            <div className="px-1 py-0.5 text-[7px] font-bold text-white text-center" style={{ background: ORANGE }}>COMPANY STAMP</div>
            <div className="flex-1 min-h-[50px] flex items-center justify-center p-2" style={{ background: FIELD_BG }}>
              {data.companyStamp ? (
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-red-400 flex items-center justify-center text-[6px] text-red-500 text-center font-bold rotate-[-8deg]">
                  {data.companyStamp}
                </div>
              ) : (
                <span className="text-[7px] text-red-400 font-bold border-2 border-dashed border-red-300 px-3 py-4">STAMP</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-black/30 mt-2 text-[6px] sm:text-[7px] text-[#333]">
          <div>
            <p>Tel: +971 4 000 0000 · P.O.Box Dubai, U.A.E.</p>
            <p>Email: documents@ahamson.com</p>
            <p className="font-bold mt-0.5">{DOC_REF}</p>
          </div>
          <p className="font-bold">Page 1/2</p>
          <p className="font-bold">www.ahamson.com</p>
        </div>
      </div>
    </div>
  );
}

function Page2() {
  const rows = [
    "Sales Name with SR No.",
    "Sales Admin Name",
    "Business Unit Manager Name",
    "Accountant Name",
    "Finance Manager Name",
    "Document Controller Name",
  ];

  return (
    <div className="relative bg-white shadow-2xl border border-black/20 mt-6" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Watermark />
      <div className="relative p-3 sm:p-4">
        <p className="text-center text-[9px] font-bold text-[#64748B] mb-3 uppercase tracking-widest">Internal Use Only — Page 2</p>
        {rows.map(row => (
          <div key={row} className="grid grid-cols-12 gap-0 mb-0">
            <div className="col-span-8 border border-black/70">
              <div className="px-2 py-1 text-[8px] font-bold text-white" style={{ background: ORANGE }}>{row}</div>
              <div className="min-h-[36px]" style={{ background: FIELD_BG }} />
            </div>
            <div className="col-span-4 border border-black/70 border-l-0">
              <div className="px-2 py-1 text-[8px] font-bold text-white" style={{ background: ORANGE }}>Signature & Date:</div>
              <div className="min-h-[36px]" style={{ background: FIELD_BG }} />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-0 mt-0">
          {["Approved Credit Days", "Credit Limit", "Approved by General Manager"].map(h => (
            <div key={h} className="border border-black/70">
              <div className="px-2 py-1 text-[7px] font-bold text-white text-center" style={{ background: ORANGE }}>{h}</div>
              <div className="min-h-[40px]" style={{ background: FIELD_BG }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-end pt-3 mt-3 border-t border-black/30 text-[6px] text-[#333]">
          <div>
            <p>Tel: +971 4 000 0000 · P.O.Box Dubai, U.A.E.</p>
            <p>Email: documents@ahamson.com · {DOC_REF}</p>
          </div>
          <Shield className="w-6 h-6 text-[#0B1F3A] opacity-30" />
          <div className="text-right">
            <p className="font-bold">Page 2/2</p>
            <p className="font-bold">www.ahamson.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaperFormPreview({ data, companyName, page = "both", className, activeSection }: PaperFormPreviewProps) {
  return (
    <div className={cn("select-none", className)}>
      {(page === 1 || page === "both") && <Page1 data={data} companyName={companyName} activeSection={activeSection} />}
      {(page === 2 || page === "both") && <Page2 />}
    </div>
  );
}

export function computeFormProgress(data: DocumentFormData): number {
  const fields = [
    data.legalName, data.poBox, data.emirate, data.telephone, data.email,
    data.businessNature, data.legalStatus, data.tradeLicenseNumber,
    data.ownerName, data.gmName,
  ];
  const filled = fields.filter(f => f?.trim()).length;
  const sigs = [...data.lpoSignatories, ...data.chequeSignatories].filter(p => p.signature).length;
  const docs = Object.values(data.documents).filter(Boolean).length;
  const total = fields.length + 4 + DOCUMENT_CHECKLIST_ITEMS.length;
  return Math.min(100, Math.round(((filled + sigs + docs + (data.declarationSignature ? 1 : 0)) / total) * 100));
}
