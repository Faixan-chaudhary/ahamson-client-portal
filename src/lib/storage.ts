import type { CreateLinkInput, CreateUserInput, CreateDealLinkInput, DealLink, DealRegistration, DocumentFormData, DocumentLink, InternalApproval, ListQuery, ListResult, PipelineEntry, PipelineEntryInput, PortalUser, Submission, UpdateUserInput } from "./types";
import { getAppOrigin } from "./utils";
import {
  createDeal,
  createDealLink,
  createPipelineEntry,
  createSubmission,
  createUser,
  deletePipelineEntry,
  deleteUser,
  downloadPipelineExcel,
  fetchClientDealLink,
  fetchClientLink,
  fetchDashboard,
  fetchDeal,
  fetchDealDraft,
  fetchDealLinks,
  fetchDeals,
  fetchDocumentLinks,
  fetchDraft,
  fetchPipeline,
  fetchSubmission,
  fetchSubmissions,
  fetchSubmittedDocument,
  fetchUsers,
  markClientDealOpened,
  markClientOpened,
  saveApproval,
  saveDealDraftApi,
  saveDraftApi,
  submitDealViaLinkApi,
  submitDocumentApi,
  updateDealStatus,
  updatePipelineEntry,
  updateUser,
} from "./api";
import type { DashboardData } from "./api";
import type { DealRegistrationFormData } from "./deal-registration-types";

export async function getDashboard(): Promise<DashboardData> {
  return fetchDashboard();
}

export async function getSubmissions(params: ListQuery = {}): Promise<ListResult<Submission>> {
  return fetchSubmissions(params);
}

export async function getDocumentLinks(params: ListQuery = {}): Promise<ListResult<DocumentLink>> {
  return fetchDocumentLinks(params);
}

export async function getUsers(params: ListQuery = {}): Promise<ListResult<PortalUser>> {
  return fetchUsers(params);
}

export async function createPortalUser(input: CreateUserInput): Promise<PortalUser> {
  return createUser(input);
}

export async function updatePortalUser(id: number, input: UpdateUserInput): Promise<PortalUser> {
  return updateUser(id, input);
}

export async function removePortalUser(id: number): Promise<void> {
  return deleteUser(id);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  try {
    return await fetchSubmission(id);
  } catch {
    return null;
  }
}

export async function getSubmissionByToken(token: string): Promise<Submission | null> {
  try {
    return await fetchClientLink(token);
  } catch {
    return null;
  }
}

export async function markSubmissionOpened(token: string): Promise<void> {
  await markClientOpened(token);
}

export async function saveDraft(token: string, data: DocumentFormData): Promise<void> {
  await saveDraftApi(token, data);
}

export async function getDraft(token: string): Promise<DocumentFormData | null> {
  return fetchDraft(token);
}

export async function submitDocument(token: string, data: DocumentFormData): Promise<void> {
  await submitDocumentApi(token, data);
}

export async function getSubmittedDocument(token: string): Promise<DocumentFormData | null> {
  return fetchSubmittedDocument(token);
}

export function isLinkExpired(submission: Submission): boolean {
  if (submission.status === "expired") return true;
  return new Date(submission.expiresAt) < new Date();
}

export function getClientLink(token: string) {
  return `${getAppOrigin()}/client/document/${token}`;
}

export async function saveInternalApproval(id: string, approval: InternalApproval): Promise<Submission> {
  return saveApproval(id, approval);
}

export async function getClientLinkFromApi(input: CreateLinkInput): Promise<{ submission: Submission; link: string }> {
  const res = await createSubmission(input);
  return { submission: res.submission, link: res.clientUrl };
}

export function getDealClientLink(token: string) {
  return `${getAppOrigin()}/client/deal/${token}`;
}

export async function getDealLinkFromApi(input: CreateDealLinkInput): Promise<{ deal: DealRegistration; link: string }> {
  const res = await createDealLink(input);
  return { deal: res.deal, link: res.clientUrl };
}

export async function getDealLinks(params: ListQuery = {}): Promise<ListResult<DealLink>> {
  return fetchDealLinks(params);
}

export async function getClientDealLink(token: string): Promise<DealRegistration> {
  return fetchClientDealLink(token);
}

export async function markDealLinkOpened(token: string): Promise<void> {
  return markClientDealOpened(token);
}

export async function getDealFormDraft(token: string): Promise<DealRegistrationFormData | null> {
  const data = await fetchDealDraft(token);
  return data as DealRegistrationFormData | null;
}

export async function saveDealFormDraft(token: string, data: DealRegistrationFormData): Promise<void> {
  await saveDealDraftApi(token, data as unknown as Record<string, unknown>);
}

export async function submitDealFormViaLink(token: string, data: DealRegistrationFormData): Promise<DealRegistration> {
  return submitDealViaLinkApi(token, data as unknown as Record<string, unknown>);
}

export function isDealLinkExpired(deal: Pick<DealRegistration, "status" | "expiresAt" | "submittedAt">): boolean {
  if (deal.submittedAt) return false;
  if (deal.status === "expired") return true;
  if (!deal.expiresAt) return false;
  return new Date(deal.expiresAt).getTime() < Date.now();
}

export async function getDeals(params: ListQuery = {}): Promise<ListResult<DealRegistration>> {
  return fetchDeals(params);
}

export async function submitDealRegistration(data: DealRegistrationFormData): Promise<DealRegistration> {
  return createDeal(data as unknown as Record<string, unknown>);
}

export async function getDealById(id: string): Promise<DealRegistration | null> {
  try {
    return await fetchDeal(id);
  } catch {
    return null;
  }
}

export async function setDealStatus(
  id: string,
  payload: {
    status: string;
    remarks?: string | null;
    dealId?: string | null;
    registeredBy?: string | null;
    registrationDate?: string | null;
  },
): Promise<DealRegistration> {
  return updateDealStatus(id, payload);
}

export async function getPipeline(params: import("./api").PipelineFilters = {}): Promise<ListResult<PipelineEntry>> {
  return fetchPipeline(params);
}

export async function addPipelineEntry(input: PipelineEntryInput): Promise<PipelineEntry> {
  return createPipelineEntry(input);
}

export async function savePipelineEntry(id: number, input: Partial<PipelineEntryInput>): Promise<PipelineEntry> {
  return updatePipelineEntry(id, input);
}

export async function removePipelineEntry(id: number): Promise<void> {
  return deletePipelineEntry(id);
}

export async function exportPipelineSheet(params: import("./api").PipelineFilters = {}): Promise<void> {
  const blob = await downloadPipelineExcel(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AHamson-Pipeline-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export {
  fetchQuotations as getQuotations,
  fetchQuotation as getQuotation,
  fetchQuotationStats as getQuotationStats,
  createQuotationApi as addQuotation,
  updateQuotationApi as saveQuotation,
  quotationAction as runQuotationAction,
  syncPipelineFromQuotations,
  fetchPipelineReview as getPipelineReview,
  fetchSalesActivities as getSalesActivities,
  createSalesActivityApi as addSalesActivity,
  updateSalesActivityApi as saveSalesActivity,
  deleteSalesActivityApi as removeSalesActivity,
} from "./api";

export async function exportQuotationsSheet(params: import("./api").QuotationFilters = {}): Promise<void> {
  const { downloadQuotationsExcel } = await import("./api");
  const blob = await downloadQuotationsExcel(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AHamson-Quotations-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function quotationPdfFilename(opts: {
  id: number;
  quoteNumber?: string;
  phase?: string;
}): string {
  const number = (opts.quoteNumber || `quote-${opts.id}`).replace(/\//g, "-");
  const kind = (opts.phase || "").toLowerCase() === "formal" ? "Formal" : "Budgetary";
  return `AHamson-${kind}-${number}.pdf`;
}

export async function exportQuotationPdf(
  id: number,
  quoteNumber?: string,
  phase?: string,
): Promise<void> {
  const { downloadQuotationPdf } = await import("./api");
  const blob = await downloadQuotationPdf(id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = quotationPdfFilename({ id, quoteNumber, phase });
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSalesActivitiesSheet(params: import("./api").SalesActivityFilters = {}): Promise<void> {
  const { downloadSalesActivitiesExcel } = await import("./api");
  const blob = await downloadSalesActivitiesExcel(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AHamson-Sales-Activities-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
