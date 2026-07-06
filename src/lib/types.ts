export type SubmissionStatus = "pending" | "opened" | "submitted" | "expired";

export interface AuthorizedPerson {
  name: string;
  position: string;
  signature: string;
}

export interface BankReference {
  bankBranch: string;
  iban: string;
}

export interface TradeCreditReference {
  companyName: string;
  telephone: string;
  mobile: string;
  email: string;
}

export type DocumentKey =
  | "tradeLicense" | "chamberOfCommerce" | "memorandum" | "ownerEmiratesId"
  | "ownerPassport" | "signatoryEmiratesId" | "signatoryPassport"
  | "attestedSignature" | "securityCheque" | "advanceCheque" | "bankStatement";

export interface DocumentFormData {
  legalName: string;
  poBox: string;
  emirate: string;
  telephone: string;
  email: string;
  businessNature: string;
  legalStatus: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiry: string;
  periodInUae: string;
  trnNumber: string;
  makaniNumber: string;
  city: string;
  area: string;
  street: string;
  buildingNumber: string;
  office: string;
  nearestLandmark: string;
  ownerName: string;
  ownerNationality: string;
  ownerPosition: string;
  partnerName: string;
  partnerNationality: string;
  partnerPosition: string;
  gmName: string;
  gmNationality: string;
  gmPosition: string;
  lpoSignatories: AuthorizedPerson[];
  chequeSignatories: AuthorizedPerson[];
  bankReferences: BankReference[];
  tradeCreditReferences: TradeCreditReference[];
  documents: Record<DocumentKey, string | null>;
  agreementConfirmed: boolean;
  maxCreditLimit: string;
  creditPeriodDays: string;
  declarationSignature: string;
  authorizedPersonName: string;
  designation: string;
  declarationDate: string;
  companyStamp: string | null;
}

export interface Submission {
  id: string;
  token: string;
  clientCompany: string;
  contactPerson: string;
  email: string;
  phone?: string;
  internalNotes?: string;
  status: SubmissionStatus;
  createdAt: string;
  expiresAt: string;
  submittedAt?: string;
  openedAt?: string;
  formData?: DocumentFormData;
}

export interface CreateLinkInput {
  clientCompany: string;
  contactPerson: string;
  contactEmail: string;
  phone?: string;
  internalNotes?: string;
}

export interface InternalApproval {
  salesName: string;
  salesSrNo: string;
  salesAdminName: string;
  businessUnitManager: string;
  accountantName: string;
  financeManager: string;
  documentController: string;
  approvedCreditDays: string;
  creditLimit: string;
  approvedByGM: string;
  gmSignatureDate: string;
}
