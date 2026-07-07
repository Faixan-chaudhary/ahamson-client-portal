import type { CreateLinkInput, DocumentFormData, InternalApproval, Submission } from "./types";

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
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
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

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", {}, true);
}

export async function fetchDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard", {}, true);
}

export async function fetchSubmissions(): Promise<Submission[]> {
  return request<Submission[]>("/submissions", {}, true);
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
