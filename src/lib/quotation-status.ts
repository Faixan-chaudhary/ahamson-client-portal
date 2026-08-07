/** Mirrors backend/app/quotation_status.py — keep in sync. */

export const QUOTATION_STATUS = {
  BQ_PREPARED: "Budgetary Quote Prepared",
  BQ_SUBMITTED: "Budgetary Quote Submitted",
  BQ_LOST: "Budgetary Quote - Lost",
  FQ_PREPARED: "Formal Quote Prepared",
  FQ_PENDING: "Formal Quote Pending Approval",
  FQ_APPROVED: "Formal Quote Approved",
  FQ_SUBMITTED: "Formal Quote Submitted",
  FQ_REVISIONS: "Formal Quote Revisions Requested",
  FQ_NOT_APPROVED: "Formal Quote Not Approved",
  FQ_LOST: "Formal Quote - Lost",
  ORDER_DRAFT: "Order draft for OEM",
  ORDER_PENDING: "Order Pending Approval",
  ORDER_APPROVED: "Order Approved for OEM",
  ORDER_PLACED: "Order Placed to OEM",
  ORDER_DELIVERED: "Order Delivered to SI",
  ORDER_REVISIONS: "Order Revisions Requested",
  ORDER_NOT_APPROVED: "Order Not Approved",
  DEAL_CLOSED: "Deal Closed",
} as const;

export const ALL_QUOTATION_STATUSES = Object.values(QUOTATION_STATUS);

export const LOST_REASONS = [
  "End User Holds the Order",
  "High in Price",
  "End User decided to acquire any other product",
] as const;

export type QuotationActionKey =
  | "edit"
  | "submit-budgetary"
  | "followups"
  | "close-lost"
  | "start-formal"
  | "open-formal-child"
  | "submit-finance"
  | "finance-review"
  | "submit-formal"
  | "oem-draft"
  | "submit-order-approval"
  | "sales-head-review"
  | "place-oem-order"
  | "deliver"
  | "close-deal"
  | "reopen-revisions";

export function canDo(actions: string[] | undefined, key: QuotationActionKey): boolean {
  return Array.isArray(actions) && actions.includes(key);
}

export type QuotationQueueKey = "action" | "finance" | "sales_head" | "sales";

/** Default inbox filter after login — approval roles land on their queue. */
export function defaultQuotationQueue(role?: string | null): QuotationQueueKey | "" {
  if (role === "finance_manager") return "finance";
  if (role === "sales_head") return "sales_head";
  if (role === "manager") return "action";
  return "";
}

export function isApprovalAction(actions: string[] | undefined): boolean {
  return canDo(actions, "finance-review") || canDo(actions, "sales-head-review");
}
