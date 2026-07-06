import type { CreateLinkInput, DocumentFormData, Submission } from "./types";
import { MOCK_SUBMISSIONS } from "./mock-data";
import { generateToken, getAppOrigin } from "./utils";

const SUBMISSIONS_KEY = "ahamson_submissions";
const DRAFT_KEY = (token: string) => `ahamson_draft_${token}`;
const SUBMITTED_KEY = (token: string) => `ahamson_submitted_${token}`;

function readSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return MOCK_SUBMISSIONS;
}

function writeSubmissions(data: Submission[]) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(data));
}

export function getSubmissions(): Submission[] {
  return readSubmissions();
}

export function getSubmissionById(id: string): Submission | undefined {
  return readSubmissions().find(s => s.id === id);
}

export function getSubmissionByToken(token: string): Submission | undefined {
  return readSubmissions().find(s => s.token === token);
}

export function createSecureLink(input: CreateLinkInput): Submission {
  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const submission: Submission = {
    id: `DOC-${now.getFullYear()}-${String(readSubmissions().length + 1).padStart(3, "0")}`,
    token,
    clientCompany: input.clientCompany,
    contactPerson: input.contactPerson,
    email: input.contactEmail,
    phone: input.phone,
    internalNotes: input.internalNotes,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  const all = [submission, ...readSubmissions()];
  writeSubmissions(all);
  return submission;
}

export function markSubmissionOpened(token: string) {
  const all = readSubmissions();
  const idx = all.findIndex(s => s.token === token);
  if (idx === -1) return;
  if (all[idx].status === "pending") {
    all[idx] = { ...all[idx], status: "opened", openedAt: new Date().toISOString() };
    writeSubmissions(all);
  }
}

export function saveDraft(token: string, data: DocumentFormData) {
  localStorage.setItem(DRAFT_KEY(token), JSON.stringify(data));
}

export function getDraft(token: string): DocumentFormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(token));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function submitDocument(token: string, data: DocumentFormData) {
  localStorage.setItem(SUBMITTED_KEY(token), JSON.stringify(data));
  localStorage.removeItem(DRAFT_KEY(token));
  const all = readSubmissions();
  const idx = all.findIndex(s => s.token === token);
  if (idx !== -1) {
    all[idx] = {
      ...all[idx],
      status: "submitted",
      submittedAt: new Date().toISOString(),
      formData: data,
    };
    writeSubmissions(all);
  }
}

export function getSubmittedDocument(token: string): DocumentFormData | null {
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY(token));
    if (raw) return JSON.parse(raw);
    const sub = getSubmissionByToken(token);
    return sub?.formData ?? null;
  } catch {
    return null;
  }
}

export function isLinkExpired(token: string): boolean {
  const sub = getSubmissionByToken(token);
  if (!sub) return false;
  if (sub.status === "expired") return true;
  return new Date(sub.expiresAt) < new Date();
}

export function getClientLink(token: string) {
  return `${getAppOrigin()}/client/document/${token}`;
}
