import type { CreateLinkInput, DocumentFormData, InternalApproval, Submission } from "./types";
import { getAppOrigin } from "./utils";
import {
  createSubmission,
  fetchClientLink,
  fetchDashboard,
  fetchDraft,
  fetchSubmission,
  fetchSubmissions,
  fetchSubmittedDocument,
  markClientOpened,
  saveApproval,
  saveDraftApi,
  submitDocumentApi,
} from "./api";
import type { DashboardData } from "./api";

export async function getDashboard(): Promise<DashboardData> {
  return fetchDashboard();
}

export async function getSubmissions(): Promise<Submission[]> {
  return fetchSubmissions();
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

export async function createSecureLink(input: CreateLinkInput): Promise<Submission> {
  const res = await createSubmission(input);
  return res.submission;
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
