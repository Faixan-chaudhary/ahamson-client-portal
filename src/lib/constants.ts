export const NAVY = "#0B1F3A";
/** Brand gold sampled from AHamson logo (A accent + icon spiral) */
export const GOLD = "#F7931E";
export const GOLD_DARK = "#D9811A";
export const GOLD_DARKER = "#BB6F17";
export const GOLD_LIGHT = "#FEF0E8";
export const BG = "#F4F6FA";

export const EMIRATES = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah",
];

export const LEGAL_STATUSES = [
  "Sole Prop.", "Partnership", "LLC", "FZCO", "FZCE", "Others",
];

/** Reduced client checklist (meeting: previous list was too long for clients). */
export const DOCUMENT_CHECKLIST_ITEMS = [
  { key: "tradeLicense", label: "Trade License Copy", required: true },
  { key: "ownerEmiratesId", label: "Owner / Partner Emirates ID Copy", required: true },
  { key: "ownerPassport", label: "Owner / Partner Passport Copy" },
  { key: "signatoryEmiratesId", label: "Emirates ID — Authorized Signatories" },
  { key: "securityCheque", label: "Security Cheque", required: true },
  { key: "bankStatement", label: "Bank Statement", required: true },
] as const;
