import type { DocumentFormData, DocumentKey } from "./types";
import { DOCUMENT_CHECKLIST_ITEMS } from "./constants";

const emptyPerson = () => ({ name: "", position: "", signature: "" });

const ALL_DOC_KEYS: DocumentKey[] = [
  "tradeLicense", "chamberOfCommerce", "memorandum", "ownerEmiratesId",
  "ownerPassport", "signatoryEmiratesId", "signatoryPassport",
  "attestedSignature", "securityCheque", "advanceCheque", "bankStatement",
];

export const defaultDocumentForm = (): DocumentFormData => ({
  legalName: "",
  poBox: "",
  emirate: "",
  telephone: "",
  email: "",
  businessNature: "",
  legalStatus: "",
  tradeLicenseNumber: "",
  tradeLicenseExpiry: "",
  periodInUae: "",
  trnNumber: "",
  makaniNumber: "",
  city: "",
  area: "",
  street: "",
  buildingNumber: "",
  office: "",
  nearestLandmark: "",
  ownerName: "",
  ownerNationality: "",
  ownerPosition: "",
  partnerName: "",
  partnerNationality: "",
  partnerPosition: "",
  gmName: "",
  gmNationality: "",
  gmPosition: "",
  lpoSignatories: [emptyPerson()],
  chequeSignatories: [emptyPerson()],
  bankReferences: [{ bankBranch: "", iban: "" }],
  tradeCreditReferences: [{ companyName: "", telephone: "", mobile: "", email: "" }],
  documents: Object.fromEntries([
    ...ALL_DOC_KEYS.map(k => [k, null]),
    ...DOCUMENT_CHECKLIST_ITEMS.map(d => [d.key, null]),
  ]) as DocumentFormData["documents"],
  agreementConfirmed: false,
  maxCreditLimit: "",
  creditPeriodDays: "",
  declarationSignature: "",
  authorizedPersonName: "",
  designation: "",
  declarationDate: new Date().toISOString().split("T")[0],
  companyStamp: null,
});
