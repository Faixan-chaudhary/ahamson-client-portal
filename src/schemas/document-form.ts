import { z } from "zod";
import { DOCUMENT_CHECKLIST_ITEMS } from "@/lib/constants";

const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  signature: z.string().min(1, "Signature is required"),
});

export const companyInfoSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  poBox: z.string().min(1, "P.O. Box is required"),
  emirate: z.string().min(1, "Emirate is required"),
  telephone: z.string().min(1, "Telephone is required"),
  email: z.string().email("Valid email required"),
  businessNature: z.string().min(1, "Business nature is required"),
  legalStatus: z.string().min(1, "Legal status is required"),
  tradeLicenseNumber: z.string().min(1, "Trade license number is required"),
  tradeLicenseExpiry: z.string().min(1, "Expiry date is required"),
  periodInUae: z.string().min(1, "Period in UAE is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  street: z.string().min(1, "Street is required"),
  buildingNumber: z.string().min(1, "Building/Villa number is required"),
  office: z.string().optional(),
  nearestLandmark: z.string().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerNationality: z.string().min(1, "Owner nationality is required"),
  ownerPosition: z.string().min(1, "Owner position is required"),
  partnerName: z.string().optional(),
  partnerNationality: z.string().optional(),
  partnerPosition: z.string().optional(),
  gmName: z.string().min(1, "GM name is required"),
  gmNationality: z.string().min(1, "GM nationality is required"),
  gmPosition: z.string().min(1, "GM position is required"),
});

export const lpoSchema = z.object({
  lpoSignatories: z.array(personSchema).min(1).max(2),
});

export const chequeSchema = z.object({
  chequeSignatories: z.array(personSchema).min(1).max(2),
});

export const bankSchema = z.object({
  bankReferences: z.array(z.object({
    bankBranch: z.string().min(1, "Bank & branch is required"),
    iban: z.string().min(1, "IBAN is required"),
  })).min(1),
});

export const tradeCreditSchema = z.object({
  tradeCreditReferences: z.array(z.object({
    companyName: z.string().min(1, "Company name is required"),
    telephone: z.string().min(1, "Telephone is required"),
    mobile: z.string().min(1, "Mobile is required"),
    email: z.string().email("Valid email required"),
  })).min(1),
});

export const documentsSchema = z.object({
  documents: z.record(z.string().nullable()),
}).superRefine((data, ctx) => {
  for (const item of DOCUMENT_CHECKLIST_ITEMS) {
    if (item.required && !data.documents[item.key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${item.label} is required`,
        path: ["documents", item.key],
      });
    }
  }
});

export const declarationSchema = z.object({
  agreementConfirmed: z.literal(true, { errorMap: () => ({ message: "You must confirm the agreement" }) }),
  maxCreditLimit: z.string().min(1, "Credit limit is required"),
  creditPeriodDays: z.string().min(1, "Credit period is required"),
  declarationSignature: z.string().min(1, "Signature is required"),
  authorizedPersonName: z.string().min(1, "Authorized person name is required"),
  designation: z.string().min(1, "Designation is required"),
  declarationDate: z.string().min(1, "Date is required"),
  companyStamp: z.string().nullable(),
});

export const STEP_SCHEMAS = [
  companyInfoSchema,
  lpoSchema,
  chequeSchema,
  bankSchema,
  tradeCreditSchema,
  documentsSchema,
  declarationSchema,
];
