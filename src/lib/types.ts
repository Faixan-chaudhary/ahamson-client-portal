export type SubmissionStatus = "pending" | "opened" | "submitted" | "expired";

export type UserRole = "admin" | "manager" | "finance_manager" | "sales_head" | "staff";

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
  approval?: InternalApproval;
}

export interface CreateLinkInput {
  clientCompany: string;
  contactPerson: string;
  contactEmail: string;
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

export interface DocumentLink {
  id: string;
  token: string;
  clientCompany: string;
  contactPerson: string;
  email: string;
  status: SubmissionStatus;
  createdAt: string;
  expiresAt: string;
  submittedAt?: string;
  clientUrl: string;
}

export interface PortalUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ListQuery {
  search?: string;
  status?: string;
  role?: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
}

export type DealStatus = "pending" | "opened" | "approved" | "rejected" | "expired";

export interface DealRegistration {
  id: string;
  token?: string | null;
  partnerCompanyName: string;
  contactPerson: string;
  email: string;
  endCustomerName: string;
  projectName: string;
  estimatedValueUsd: string;
  status: DealStatus;
  remarks?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  openedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  formData?: import("./deal-registration-types").DealRegistrationFormData | null;
  createdByName?: string | null;
  clientUrl?: string | null;
}

export interface CreateDealLinkInput {
  partnerCompanyName: string;
  contactPerson: string;
  contactEmail: string;
}

export interface DealLink {
  id: string;
  token: string;
  partnerCompanyName: string;
  contactPerson: string;
  email: string;
  status: DealStatus | string;
  createdAt: string;
  expiresAt?: string | null;
  submittedAt?: string | null;
  clientUrl: string;
}

export interface ActivityLogItem {
  action: string;
  detail?: string;
  by?: string;
  role?: string;
  at?: string;
}

export interface PipelineEntry {
  id: number;
  quoteDate?: string | null;
  sp: string;
  partner: string;
  endUser: string;
  country: string;
  brand: string;
  product: string;
  valueAed: string;
  gpAed: string;
  contactName: string;
  closure: string;
  probability: string;
  status: string;
  details: string;
  activityLogs?: ActivityLogItem[];
  createdAt: string;
  updatedAt: string;
}

export type PipelineEntryInput = Omit<PipelineEntry, "id" | "createdAt" | "updatedAt" | "activityLogs">;

export type QuotationPhase = "budgetary" | "formal";

export interface QuotationFollowUp {
  date: string;
  remarks: string;
  by?: string;
  at?: string;
}

export interface QuotationApproval {
  type: string;
  date: string;
  action: string;
  remarks?: string;
  by?: string;
  role?: string;
  at?: string;
}

export type QuotationActivityLog = ActivityLogItem;

export interface Quotation {
  id: number;
  quoteNumber: string;
  phase: QuotationPhase | string;
  status: string;
  quotationDate: string;
  salesPerson: string;
  partner: string;
  endUser: string;
  country: string;
  brand: string;
  products: string;
  dealValue: string;
  gpValue: string;
  contactPerson: string;
  closureDate: string;
  probability: string;
  details: string;
  siAttachmentName: string;
  siAttachmentNote: string;
  quotationSubmissionDate: string;
  closureReason: string;
  closureRemarks: string;
  parentQuoteId?: number | null;
  childQuoteId?: number | null;
  parentQuoteNumber?: string;
  childQuoteNumber?: string;
  formalSubmissionDate: string;
  poFileName: string;
  poNote: string;
  oem: string;
  orderDate: string;
  orderDetails: string;
  expectedDeliveryDate: string;
  orderSubmissionDate: string;
  orderRemarks: string;
  invoiceFileName: string;
  deliveryDocsNote: string;
  deliveryDate: string;
  deliveryRemarks: string;
  paymentReceivedDate: string;
  paymentDocsNote: string;
  paymentRemarks: string;
  followups: QuotationFollowUp[];
  approvals: QuotationApproval[];
  activityLogs: QuotationActivityLog[];
  allowedActions: string[];
  actionHint?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: number | null;
}

export type QuotationInput = {
  quotationDate?: string;
  salesPerson?: string;
  partner?: string;
  endUser?: string;
  country?: string;
  brand?: string;
  products?: string;
  dealValue?: string;
  gpValue?: string;
  contactPerson?: string;
  closureDate?: string;
  probability?: string;
  details?: string;
  siAttachmentName?: string;
  siAttachmentNote?: string;
};

export interface SalesActivity {
  id: number;
  salesPerson: string;
  customerName: string;
  meetingDate: string;
  contactPerson: string;
  contactNumber: string;
  meetingOutputs: string;
  activityLogs?: ActivityLogItem[];
  createdAt: string;
  updatedAt: string;
  createdById?: number | null;
}

export type SalesActivityInput = {
  salesPerson?: string;
  customerName?: string;
  meetingDate?: string;
  contactPerson?: string;
  contactNumber?: string;
  meetingOutputs?: string;
};

