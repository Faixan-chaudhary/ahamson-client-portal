export type CustomerIndustry = "commercial" | "industrial" | "government" | "healthcare" | "other";
export type ProjectStage =
  | "leadIdentified"
  | "inDiscussion"
  | "proposalSubmitted"
  | "negotiation"
  | "purchaseOrderExpected";
export type SalicruProduct = "slcAdapt" | "slcTwinPro" | "slcCube4" | "other";
export type BatteryType = "internal" | "external" | "niCd" | "lithiumIon" | "vrla";
export type SupportNeed = "techPresentation" | "siteVisit" | "pricing" | "documentation" | "others";
export type ApprovalStatus = "approved" | "pending" | "rejected" | "";

export interface DealRegistrationFormData {
  formDate: string;
  partnerCompanyName: string;
  contactPerson: string;
  designation: string;
  phoneNumber: string;
  emailAddress: string;
  endCustomerName: string;
  customerIndustry: CustomerIndustry | "";
  customerIndustryOther: string;
  projectName: string;
  projectLocation: string;
  estimatedValueUsd: string;
  expectedClosingDate: string;
  projectStage: ProjectStage | "";
  products: SalicruProduct[];
  productOther: string;
  requiredCapacity: string;
  runtimeMinutes: string;
  numberOfUnits: string;
  batteryTypes: BatteryType[];
  accessories: string;
  otherBrands: string;
  uniqueAdvantage: string;
  registeredWithOtherVendor: "yes" | "no" | "";
  supportNeeds: SupportNeed[];
  partnerSignature: string;
  partnerSignatureDate: string;
  dealId: string;
  registeredBy: string;
  registrationDate: string;
  approvalStatus: ApprovalStatus;
  remarks: string;
}

export function defaultDealRegistrationForm(): DealRegistrationFormData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    formDate: today,
    partnerCompanyName: "",
    contactPerson: "",
    designation: "",
    phoneNumber: "",
    emailAddress: "",
    endCustomerName: "",
    customerIndustry: "",
    customerIndustryOther: "",
    projectName: "",
    projectLocation: "",
    estimatedValueUsd: "",
    expectedClosingDate: "",
    projectStage: "",
    products: [],
    productOther: "",
    requiredCapacity: "",
    runtimeMinutes: "",
    numberOfUnits: "",
    batteryTypes: [],
    accessories: "",
    otherBrands: "",
    uniqueAdvantage: "",
    registeredWithOtherVendor: "",
    supportNeeds: [],
    partnerSignature: "",
    partnerSignatureDate: today,
    dealId: "",
    registeredBy: "",
    registrationDate: today,
    approvalStatus: "",
    remarks: "",
  };
}

export function computeDealFormProgress(data: DealRegistrationFormData): number {
  const textFields = [
    data.partnerCompanyName, data.contactPerson, data.designation, data.phoneNumber, data.emailAddress,
    data.endCustomerName, data.projectName, data.projectLocation, data.estimatedValueUsd,
    data.requiredCapacity, data.runtimeMinutes, data.numberOfUnits, data.accessories,
    data.otherBrands, data.uniqueAdvantage,
  ];
  const filledText = textFields.filter(v => v.trim()).length;
  const choices =
    (data.customerIndustry ? 1 : 0)
    + (data.projectStage ? 1 : 0)
    + (data.products.length ? 1 : 0)
    + (data.batteryTypes.length ? 1 : 0)
    + (data.registeredWithOtherVendor ? 1 : 0)
    + (data.supportNeeds.length ? 1 : 0)
    + (data.partnerSignature ? 1 : 0);
  const total = textFields.length + 7;
  return Math.min(100, Math.round(((filledText + choices) / total) * 100));
}
