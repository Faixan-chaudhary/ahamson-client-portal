import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { DocumentFormData } from "./types";
import {
  mapFormToPdfFields, mapDropdownFields, getCheckedDocuments, todayFormatted,
} from "./pdf-field-map";
import { resolveFontSize, verticalTextOffset } from "./pdf-field-fonts";

const PDF_URL = "/forms/client-registration-bts-v1.pdf";
const FORM_FONT_URL = "/fonts/Roboto-Regular.ttf";

let templateBytes: ArrayBuffer | null = null;
let formFontBytes: ArrayBuffer | null = null;

export async function preloadPdfTemplate(): Promise<void> {
  if (!templateBytes) {
    templateBytes = await fetch(PDF_URL).then(r => r.arrayBuffer());
  }
  if (!formFontBytes) {
    formFontBytes = await fetch(FORM_FONT_URL).then(r => r.arrayBuffer());
  }
}

async function getTemplateBytes(): Promise<ArrayBuffer> {
  if (!templateBytes) await preloadPdfTemplate();
  return templateBytes!;
}

async function getFormFontBytes(): Promise<ArrayBuffer> {
  if (!formFontBytes) await preloadPdfTemplate();
  return formFontBytes!;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function embedSignature(
  pdfDoc: PDFDocument, pageIndex: number, dataUrl: string,
  rect: { x: number; y: number; w: number; h: number },
) {
  if (!dataUrl?.startsWith("data:image")) return;
  try {
    const bytes = dataUrlToBytes(dataUrl);
    const img = dataUrl.includes("image/png")
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
    pdfDoc.getPages()[pageIndex]!.drawImage(img, { x: rect.x, y: rect.y, width: rect.w, height: rect.h });
  } catch { /* skip */ }
}

function hideWidgets(form: ReturnType<PDFDocument["getForm"]>, fieldName: string) {
  try {
    const field = form.getField(fieldName);
    try { form.getTextField(fieldName).setText(""); } catch { /* dropdown/checkbox */ }
    for (const widget of field.acroField.getWidgets()) {
      widget.setFlag(2);
    }
  } catch { /* skip */ }
}

function drawAtField(
  pdfDoc: PDFDocument,
  font: PDFFont,
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  text: string,
  pageIndex = 0,
) {
  if (!text.trim()) return;
  try {
    hideWidgets(form, fieldName);
    const field = form.getField(fieldName);
    const rect = field.acroField.getWidgets()[0]!.getRectangle();
    const size = resolveFontSize(fieldName, text, rect.width);
    const page = pdfDoc.getPages()[pageIndex]!;
    page.drawText(text, {
      x: rect.x + 2,
      y: rect.y + verticalTextOffset(fieldName, rect.height, size),
      size,
      font,
      color: rgb(0, 0, 0),
    });
  } catch { /* skip */ }
}

function drawDropdown(
  pdfDoc: PDFDocument,
  font: PDFFont,
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  value: string,
  pageIndex = 0,
) {
  if (!value || value === "Please Select") return;
  try {
    const field = form.getDropdown(fieldName);
    const opts = field.getOptions();
    const match = opts.find(o => o.toLowerCase() === value.toLowerCase())
      ?? opts.find(o => o.toLowerCase().includes(value.toLowerCase().slice(0, 4)))
      ?? value;
    hideWidgets(form, fieldName);
    drawAtField(pdfDoc, font, form, fieldName, match, pageIndex);
  } catch { /* skip */ }
}

function setCheckbox(form: ReturnType<PDFDocument["getForm"]>, name: string) {
  try { form.getCheckBox(name).check(); } catch { /* skip */ }
}

export async function fillRegistrationPdf(data: DocumentFormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(await getTemplateBytes());
  const form = pdfDoc.getForm();

  const textFields = mapFormToPdfFields(data);
  const dropdowns = mapDropdownFields(data);
  const today = todayFormatted();

  for (const cb of getCheckedDocuments(data)) setCheckbox(form, cb);

  hideWidgets(form, "Date1_af_date");
  hideWidgets(form, "Sign");
  hideWidgets(form, "Sign_2");
  hideWidgets(form, "Sign_3");
  hideWidgets(form, "Sign_4");

  let formFont: PDFFont | null = null;
  try {
    pdfDoc.registerFontkit(fontkit);
    formFont = await pdfDoc.embedFont(await getFormFontBytes());
    form.updateFieldAppearances(formFont);
  } catch { /* ignore */ }

  if (formFont) {
    for (const [name, value] of Object.entries(textFields)) {
      drawAtField(pdfDoc, formFont, form, name, value);
    }
    drawAtField(pdfDoc, formFont, form, "Tex2", today);
    for (const [name, value] of Object.entries(dropdowns)) {
      drawDropdown(pdfDoc, formFont, form, name, value);
    }
  }

  const page0 = 0;
  if (data.lpoSignatories[0]?.signature) {
    await embedSignature(pdfDoc, page0, data.lpoSignatories[0].signature, { x: 320, y: 517, w: 82, h: 29 });
  }
  if (data.lpoSignatories[1]?.signature) {
    await embedSignature(pdfDoc, page0, data.lpoSignatories[1].signature, { x: 320, y: 484, w: 82, h: 29 });
  }
  if (data.chequeSignatories[0]?.signature) {
    await embedSignature(pdfDoc, page0, data.chequeSignatories[0].signature, { x: 322, y: 436, w: 80, h: 29 });
  }
  if (data.chequeSignatories[1]?.signature) {
    await embedSignature(pdfDoc, page0, data.chequeSignatories[1].signature, { x: 320, y: 402, w: 82, h: 29 });
  }
  if (data.declarationSignature) {
    await embedSignature(pdfDoc, page0, data.declarationSignature, { x: 58, y: 128, w: 180, h: 28 });
  }

  return pdfDoc.save();
}

export async function fillRegistrationPdfBlob(data: DocumentFormData): Promise<Blob> {
  return new Blob([await fillRegistrationPdf(data)], { type: "application/pdf" });
}
