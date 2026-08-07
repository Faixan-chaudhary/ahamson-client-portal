import type { CreateLinkInput, CreateUserInput, DocumentFormData, DocumentLink, InternalApproval, ListQuery, ListResult, PortalUser, Submission, UpdateUserInput, UserRole } from "./types";
import { clearSession } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("ahamson_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    return "Request failed";
  } catch {
    return "Request failed";
  }
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string>),
  };
  if (auth) Object.assign(headers, authHeaders());
  const res = await fetch(`${API_BASE}/api${path}`, { ...init, headers });
  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403)) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export interface DashboardStats {
  total: number;
  pending: number;
  opened: number;
  submitted: number;
  expired: number;
}

export interface DashboardData {
  stats: DashboardStats;
  submissions: Submission[];
}

export interface AppConfig {
  linkExpireHours: number;
  supportEmail: string;
}

export async function fetchAppConfig(): Promise<AppConfig> {
  return request<AppConfig>("/config");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function getMe(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", {}, true);
}

export async function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard", {}, true);
}

export async function fetchSubmissions(params: ListQuery = {}): Promise<ListResult<Submission>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<ListResult<Submission>>(`/submissions${suffix}`, {}, true);
}

export async function fetchDocumentLinks(params: ListQuery = {}): Promise<ListResult<DocumentLink>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<ListResult<DocumentLink>>(`/links${suffix}`, {
    headers: { "X-Client-Origin": window.location.origin },
  }, true);
}

export async function fetchUsers(params: ListQuery = {}): Promise<ListResult<PortalUser>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role && params.role !== "all") query.set("role", params.role);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<ListResult<PortalUser>>(`/users${suffix}`, {}, true);
}

export async function createUser(input: CreateUserInput): Promise<PortalUser> {
  return request<PortalUser>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<PortalUser> {
  return request<PortalUser>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, true);
}

export async function deleteUser(id: number): Promise<void> {
  await request(`/users/${id}`, { method: "DELETE" }, true);
}

export async function fetchSubmission(id: string): Promise<Submission> {
  return request<Submission>(`/submissions/${id}`, {}, true);
}

export async function createSubmission(input: CreateLinkInput): Promise<{ submission: Submission; clientUrl: string }> {
  return request<{ submission: Submission; clientUrl: string }>("/submissions", {
    method: "POST",
    headers: { "X-Client-Origin": window.location.origin },
    body: JSON.stringify({
      clientCompany: input.clientCompany,
      contactPerson: input.contactPerson,
      contactEmail: input.contactEmail,
    }),
  }, true);
}

export async function saveApproval(id: string, approval: InternalApproval): Promise<Submission> {
  return request<Submission>(`/submissions/${id}/approval`, {
    method: "PATCH",
    body: JSON.stringify(approval),
  }, true);
}

export async function fetchClientLink(token: string): Promise<Submission> {
  return request<Submission>(`/client/links/${token}`);
}

export async function markClientOpened(token: string): Promise<void> {
  await request(`/client/links/${token}/open`, { method: "POST" });
}

export async function fetchDraft(token: string): Promise<DocumentFormData | null> {
  const res = await request<{ data: DocumentFormData | null }>(`/client/links/${token}/draft`);
  return res.data;
}

export async function saveDraftApi(token: string, data: DocumentFormData): Promise<void> {
  await request(`/client/links/${token}/draft`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitDocumentApi(token: string, data: DocumentFormData): Promise<Submission> {
  return request<Submission>(`/client/links/${token}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchSubmittedDocument(token: string): Promise<DocumentFormData | null> {
  const res = await request<{ data: DocumentFormData | null }>(`/client/links/${token}/preview`);
  return res.data;
}

export async function fetchDeals(params: ListQuery = {}): Promise<ListResult<import("./types").DealRegistration>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/deals${suffix}`, {}, true);
}

export async function createDeal(formData: Record<string, unknown>): Promise<import("./types").DealRegistration> {
  return request("/deals", {
    method: "POST",
    body: JSON.stringify({ formData }),
  }, true);
}

export async function fetchDeal(id: string): Promise<import("./types").DealRegistration> {
  return request(`/deals/${id}`, {}, true);
}

export async function updateDealStatus(
  id: string,
  payload: {
    status: string;
    remarks?: string | null;
    dealId?: string | null;
    registeredBy?: string | null;
    registrationDate?: string | null;
  },
): Promise<import("./types").DealRegistration> {
  return request(`/deals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export async function fetchDealLinks(params: ListQuery = {}): Promise<ListResult<import("./types").DealLink>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/deal-links${suffix}`, {
    headers: { "X-Client-Origin": window.location.origin },
  }, true);
}

export async function createDealLink(input: import("./types").CreateDealLinkInput): Promise<{ deal: import("./types").DealRegistration; clientUrl: string }> {
  return request("/deal-links", {
    method: "POST",
    headers: { "X-Client-Origin": window.location.origin },
    body: JSON.stringify(input),
  }, true);
}

export async function fetchClientDealLink(token: string): Promise<import("./types").DealRegistration> {
  return request(`/client/deal-links/${token}`);
}

export async function markClientDealOpened(token: string): Promise<void> {
  await request(`/client/deal-links/${token}/open`, { method: "POST" });
}

export async function fetchDealDraft(token: string): Promise<Record<string, unknown> | null> {
  const res = await request<{ data: Record<string, unknown> | null }>(`/client/deal-links/${token}/draft`);
  return res.data;
}

export async function saveDealDraftApi(token: string, data: Record<string, unknown>): Promise<void> {
  await request(`/client/deal-links/${token}/draft`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitDealViaLinkApi(token: string, data: Record<string, unknown>): Promise<import("./types").DealRegistration> {
  return request(`/client/deal-links/${token}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type PipelineFilters = ListQuery & {
  brand?: string;
  country?: string;
  sp?: string;
  closure?: string;
};

function pipelineQueryString(params: PipelineFilters = {}): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  for (const key of ["status", "brand", "country", "sp", "closure"] as const) {
    const value = params[key];
    if (value && value !== "all") query.set(key, value);
  }
  return query.toString() ? `?${query.toString()}` : "";
}

export async function fetchPipeline(params: PipelineFilters = {}): Promise<ListResult<import("./types").PipelineEntry>> {
  return request(`/pipeline${pipelineQueryString(params)}`, {}, true);
}

export async function createPipelineEntry(input: import("./types").PipelineEntryInput): Promise<import("./types").PipelineEntry> {
  return request("/pipeline", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export async function updatePipelineEntry(
  id: number,
  input: Partial<import("./types").PipelineEntryInput>,
): Promise<import("./types").PipelineEntry> {
  return request(`/pipeline/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, true);
}

export async function deletePipelineEntry(id: number): Promise<void> {
  await request(`/pipeline/${id}`, { method: "DELETE" }, true);
}

export async function downloadPipelineExcel(params: PipelineFilters = {}): Promise<Blob> {
  const headers: Record<string, string> = { ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/pipeline/export${pipelineQueryString(params)}`, { headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new ApiError(res.status, await parseError(res));
  }
  return res.blob();
}

export type QuotationQueue = "action" | "finance" | "sales_head" | "sales" | "";

export type QuotationFilters = ListQuery & { phase?: string; queue?: QuotationQueue };

function quotationQueryString(params: QuotationFilters = {}): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.phase && params.phase !== "all") query.set("phase", params.phase);
  if (params.queue) query.set("queue", params.queue);
  return query.toString() ? `?${query.toString()}` : "";
}

export async function fetchQuotations(params: QuotationFilters = {}): Promise<ListResult<import("./types").Quotation>> {
  return request(`/quotations${quotationQueryString(params)}`, {}, true);
}

export interface QuotationStats {
  total: number;
  open: number;
  submitted: number;
  lost: number;
  closed: number;
  pendingFinance: number;
  pendingSalesHead: number;
  pendingSales?: number;
  myQueue?: number;
  byPhase?: Record<string, number>;
  byStatus?: { status: string; count: number }[];
}

export async function fetchQuotationStats(): Promise<QuotationStats> {
  return request("/quotations/stats", {}, true);
}

export async function downloadQuotationsExcel(params: QuotationFilters = {}): Promise<Blob> {
  const headers: Record<string, string> = { ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/quotations/export${quotationQueryString(params)}`, { headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new ApiError(res.status, await parseError(res));
  }
  return res.blob();
}

export async function downloadQuotationPdf(id: number): Promise<Blob> {
  const headers: Record<string, string> = { ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/quotations/${id}/pdf`, { headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new ApiError(res.status, await parseError(res));
  }
  return res.blob();
}

export async function syncPipelineFromQuotations(): Promise<{
  created: number;
  updated: number;
  skipped: number;
  totalPipeline: number;
  message: string;
}> {
  return request("/pipeline/sync-from-quotations", { method: "POST" }, true);
}

export async function fetchPipelineReview(): Promise<ListResult<import("./types").PipelineEntry>> {
  return request("/pipeline/review", {}, true);
}

export async function fetchQuotation(id: number): Promise<import("./types").Quotation> {
  return request(`/quotations/${id}`, {}, true);
}

export async function createQuotationApi(input: import("./types").QuotationInput): Promise<import("./types").Quotation> {
  return request("/quotations", { method: "POST", body: JSON.stringify(input) }, true);
}

export async function updateQuotationApi(
  id: number,
  input: Partial<import("./types").QuotationInput> & Record<string, unknown>,
): Promise<import("./types").Quotation> {
  return request(`/quotations/${id}`, { method: "PATCH", body: JSON.stringify(input) }, true);
}

export async function quotationAction(
  id: number,
  action:
    | "submit-budgetary"
    | "followups"
    | "close-lost"
    | "start-formal"
    | "submit-finance"
    | "finance-review"
    | "submit-formal"
    | "oem-draft"
    | "submit-order-approval"
    | "sales-head-review"
    | "place-oem-order"
    | "deliver"
    | "close-deal"
    | "reopen-revisions",
  body: Record<string, unknown> = {},
): Promise<import("./types").Quotation> {
  return request(`/quotations/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(body),
  }, true);
}

export type SalesActivityFilters = ListQuery & { salesPerson?: string };

function salesActivityQueryString(params: SalesActivityFilters = {}): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.salesPerson && params.salesPerson !== "all") query.set("sales_person", params.salesPerson);
  return query.toString() ? `?${query.toString()}` : "";
}

export async function fetchSalesActivities(
  params: SalesActivityFilters = {},
): Promise<ListResult<import("./types").SalesActivity>> {
  return request(`/sales-activities${salesActivityQueryString(params)}`, {}, true);
}

export async function createSalesActivityApi(
  input: import("./types").SalesActivityInput,
): Promise<import("./types").SalesActivity> {
  return request("/sales-activities", { method: "POST", body: JSON.stringify(input) }, true);
}

export async function updateSalesActivityApi(
  id: number,
  input: Partial<import("./types").SalesActivityInput>,
): Promise<import("./types").SalesActivity> {
  return request(`/sales-activities/${id}`, { method: "PATCH", body: JSON.stringify(input) }, true);
}

export async function deleteSalesActivityApi(id: number): Promise<void> {
  await request(`/sales-activities/${id}`, { method: "DELETE" }, true);
}

export async function downloadSalesActivitiesExcel(params: SalesActivityFilters = {}): Promise<Blob> {
  const headers: Record<string, string> = { ...authHeaders() };
  const res = await fetch(`${API_BASE}/api/sales-activities/export${salesActivityQueryString(params)}`, { headers });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new ApiError(res.status, await parseError(res));
  }
  return res.blob();
}
