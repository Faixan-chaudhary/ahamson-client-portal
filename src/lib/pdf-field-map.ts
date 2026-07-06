import type { DocumentFormData } from "./types";
import { DOCUMENT_CHECKLIST_ITEMS } from "./constants";

/** Maps app form data → AcroForm field names in Client Registration Form BTS v1.pdf */
export const CHECKBOX_MAP: Record<string, string> = {
  tradeLicense: "Check Box2",
  chamberOfCommerce: "Check Box3",
  memorandum: "Check Box4",
  ownerEmiratesId: "Check Box5",
  ownerPassport: "Check Box6",
  signatoryEmiratesId: "Check Box7",
  signatoryPassport: "Check Box8",
  attestedSignature: "Check Box9",
  securityCheque: "Check Box10",
  advanceCheque: "Check Box1",
  bankStatement: "Check Box11",
};

export const SIGNATURE_PLACEMENTS = [
  { field: "lpoSignatories", index: 0, rect: { x: 320, y: 517, w: 82, h: 29 } },
  { field: "lpoSignatories", index: 1, rect: { x: 320, y: 484, w: 82, h: 29 } },
  { field: "chequeSignatories", index: 0, rect: { x: 322, y: 436, w: 80, h: 29 } },
  { field: "chequeSignatories", index: 1, rect: { x: 320, y: 402, w: 82, h: 29 } },
  { field: "declaration", rect: { x: 58, y: 128, w: 180, h: 28 } },
] as const;

export function todayFormatted(): string {
  return new Date().toLocaleDateString("en-GB");
}

const EMIRATE_CODES: Record<string, string> = {
  "Abu Dhabi": "AUH",
  "Ajman": "AJM",
  "Dubai": "DXB",
  "Fujairah": "FUJ",
  "Ras Al Khaimah": "RAK",
  "Sharjah": "SHJ",
  "Umm Al Quwain": "UAQ",
};

/** Header "Code" field — derived from TRN or trade license when no dedicated code */
export function deriveRegistrationCode(data: DocumentFormData): string {
  if (data.trnNumber?.trim()) return data.trnNumber.trim().slice(0, 14);
  if (data.tradeLicenseNumber?.trim()) return data.tradeLicenseNumber.trim().slice(0, 14);
  return data.poBox?.trim() ?? "";
}

export function mapFormToPdfFields(data: DocumentFormData): Record<string, string> {
  const lpo0 = data.lpoSignatories[0];
  const lpo1 = data.lpoSignatories[1];
  const ch0 = data.chequeSignatories[0];
  const ch1 = data.chequeSignatories[1];
  const bank0 = data.bankReferences[0];
  const bank1 = data.bankReferences[1];
  const tc0 = data.tradeCreditReferences[0];
  const tc1 = data.tradeCreditReferences[1];

  return {
    Text1: deriveRegistrationCode(data),
    Text3: data.legalName,
    Text4: data.poBox,
    Text6: data.telephone,
    Text7: data.email,
    Text8: data.businessNature,
    Text10: data.tradeLicenseNumber,
    Text11: data.tradeLicenseExpiry,
    Text12: data.periodInUae,
    Text13: data.trnNumber,
    Text14: data.city,
    Text17: data.area,
    Text18: data.street,
    Text15: [data.buildingNumber, data.makaniNumber].filter(Boolean).join(" / "),
    Text2: data.office,
    Text19: data.nearestLandmark,
    Text20: data.ownerName,
    Text21: data.ownerNationality,
    Text22: data.ownerPosition,
    Text23: data.partnerName,
    Text24: data.partnerNationality,
    Text25: data.partnerPosition,
    Text26: data.gmName,
    Text27: [data.gmNationality, data.gmPosition].filter(Boolean).join(" — "),
    Text28: lpo0?.name ?? "",
    Text29: lpo0?.position ?? "",
    Text30: lpo1?.name ?? "",
    Text31: lpo1?.position ?? "",
    Text32: ch0?.name ?? "",
    Text33: ch0?.position ?? "",
    Text34: ch1?.name ?? "",
    Text35: ch1?.position ?? "",
    Text36: bank0?.bankBranch ?? "",
    Text37: bank0?.iban ?? "",
    Text38: bank1?.bankBranch ?? "",
    Text39: bank1?.iban ?? "",
    Text40: tc0?.companyName ?? "",
    Text41: tc0?.telephone ?? "",
    Text42: tc0?.mobile ?? "",
    Text9: tc0?.email ?? "",
    Text43: tc1?.companyName ?? "",
    Text44: tc1?.telephone ?? "",
    Text45: tc1?.mobile ?? "",
    Text16: tc1?.email ?? "",
    Text46: data.maxCreditLimit,
    "Credit Period Required": data.creditPeriodDays,
    Text47: data.authorizedPersonName,
    Text48: data.declarationDate,
    Text49: data.designation,
  };
}

export function mapDropdownFields(data: DocumentFormData) {
  const emirateCode = EMIRATE_CODES[data.emirate] ?? "Please Select";
  return {
    Dropdown1: data.emirate || "Please Select",
    Dropdown3: emirateCode,
    "12": data.legalStatus || "Please Select",
  };
}

export function getCheckedDocuments(data: DocumentFormData): string[] {
  return DOCUMENT_CHECKLIST_ITEMS
    .filter(d => data.documents[d.key])
    .map(d => CHECKBOX_MAP[d.key])
    .filter(Boolean);
}
