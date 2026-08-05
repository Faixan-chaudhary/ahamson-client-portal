import type { DocumentFormData } from "./types";
import { fillRegistrationPdfBlob } from "./fill-registration-pdf";

export async function downloadSubmissionPdf(formData: DocumentFormData, filename: string) {
  const blob = await fillRegistrationPdfBlob(formData);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
