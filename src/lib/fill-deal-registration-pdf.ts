import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { DealRegistrationFormData } from "./deal-registration-types";

const PDF_URL = "/forms/deal-registration-form.pdf";
const FORM_FONT_URL = "/fonts/Roboto-Regular.ttf";

let templateBytes: ArrayBuffer | null = null;
let formFontBytes: ArrayBuffer | null = null;

export async function preloadDealPdfTemplate(): Promise<void> {
  if (!templateBytes) {
    templateBytes = await fetch(PDF_URL).then(r => r.arrayBuffer());
  }
  if (!formFontBytes) {
    formFontBytes = await fetch(FORM_FONT_URL).then(r => r.arrayBuffer());
  }
}

async function getTemplateBytes(): Promise<ArrayBuffer> {
  if (!templateBytes) await preloadDealPdfTemplate();
  return templateBytes!;
}

async function getFormFontBytes(): Promise<ArrayBuffer> {
  if (!formFontBytes) await preloadDealPdfTemplate();
  return formFontBytes!;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function formatSlashDate(iso: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (m) return `${m[3]} / ${m[2]} / ${m[1]}`;
  return iso;
}

/**
 * The printed form already has "____ / ____ / ______" — draw only the
 * day/month/year digits centered inside each blank so slashes don't overlap.
 * `startX` is where the printed underscore pattern begins.
 */
function drawSlashDateSegments(
  page: PDFPage,
  font: PDFFont,
  iso: string,
  startX: number,
  y: number,
) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return;
  const [, year, month, day] = m;
  const size = 8.5;
  const put = (text: string, slotStart: number, slotWidth: number) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: startX + slotStart + Math.max(0, (slotWidth - w) / 2),
      y: y + 1.5,
      size,
      font,
      color: rgb(0.05, 0.08, 0.15),
    });
  };
  // Slots measured against the printed "____ / ____ / ______" pattern
  put(day, 0, 21);
  put(month, 30.5, 21);
  put(year, 61, 32);
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size = 9,
  maxWidth?: number,
) {
  const value = text.trim();
  if (!value) return;
  let sizeToUse = size;
  let drawn = value;
  if (maxWidth) {
    while (sizeToUse > 6.5 && font.widthOfTextAtSize(drawn, sizeToUse) > maxWidth) {
      sizeToUse -= 0.5;
    }
    while (font.widthOfTextAtSize(drawn, sizeToUse) > maxWidth && drawn.length > 3) {
      drawn = `${drawn.slice(0, -4)}…`;
    }
  }
  page.drawText(drawn, {
    x,
    y,
    size: sizeToUse,
    font,
    color: rgb(0.05, 0.08, 0.15),
  });
}

function drawCheck(page: PDFPage, _font: PDFFont, x: number, y: number) {
  // Light natural check — thin black mark over the empty box
  const ink = rgb(0, 0, 0);
  page.drawLine({
    start: { x: x + 1.8, y: y + 3.4 },
    end: { x: x + 3.8, y: y + 1.4 },
    thickness: 0.85,
    color: ink,
  });
  page.drawLine({
    start: { x: x + 3.8, y: y + 1.4 },
    end: { x: x + 7.2, y: y + 6.2 },
    thickness: 0.85,
    color: ink,
  });
}

export async function fillDealRegistrationPdf(data: DealRegistrationFormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(await getTemplateBytes());
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(await getFormFontBytes());
  const page = pdfDoc.getPages()[0]!;

  // Header date
  drawText(page, font, formatSlashDate(data.formDate), 100, 714.6, 9, 90);

  // Submitted by — values sit on underscore lines
  drawText(page, font, data.partnerCompanyName, 182, 633.5, 9, 300);
  drawText(page, font, data.contactPerson, 147, 623.2, 9, 320);
  drawText(page, font, data.designation, 132, 612.9, 9, 340);
  drawText(page, font, data.phoneNumber, 145, 602.6, 9, 320);
  drawText(page, font, data.emailAddress, 143, 592.1, 9, 320);

  // Opportunity
  drawText(page, font, data.endCustomerName, 169, 555.3, 9, 300);

  const industryChecks: Record<string, number> = {
    commercial: 157.6,
    industrial: 218.4,
    government: 267.6,
    healthcare: 330.1,
    other: 386.4,
  };
  if (data.customerIndustry && industryChecks[data.customerIndustry] != null) {
    drawCheck(page, font, industryChecks[data.customerIndustry], 542.1);
  }
  if (data.customerIndustry === "other") {
    drawText(page, font, data.customerIndustryOther, 430, 543.5, 8, 90);
  }

  drawText(page, font, data.projectName, 184, 532.9, 9, 280);
  drawText(page, font, data.projectLocation, 214, 522.6, 9, 250);
  drawText(page, font, data.estimatedValueUsd, 211, 512.3, 9, 250);
  drawSlashDateSegments(page, font, data.expectedClosingDate, 175.1, 500.5);

  const stageChecks: Record<string, number> = {
    leadIdentified: 170.2,
    inDiscussion: 242.0,
    proposalSubmitted: 308.2,
    negotiation: 399.6,
    purchaseOrderExpected: 457.9,
  };
  if (data.projectStage && stageChecks[data.projectStage] != null) {
    drawCheck(page, font, stageChecks[data.projectStage], 488.8);
  }

  // Solution
  const productChecks: Record<string, number> = {
    slcAdapt: 199.1,
    slcTwinPro: 262.0,
    slcCube4: 339.7,
    other: 402.6,
  };
  for (const p of data.products) {
    if (productChecks[p] != null) drawCheck(page, font, productChecks[p], 440.0);
  }
  if (data.products.includes("other")) {
    drawText(page, font, data.productOther, 448, 441.5, 8, 90);
  }

  drawText(page, font, data.requiredCapacity, 202, 430.8, 9, 260);
  drawText(page, font, data.runtimeMinutes, 212, 420.4, 9, 250);
  drawText(page, font, data.numberOfUnits, 151, 410.1, 9, 300);

  const batteryChecks: Record<string, number> = {
    internal: 132.1,
    external: 174.9,
    niCd: 220.7,
    lithiumIon: 256.5,
    vrla: 313.1,
  };
  for (const b of data.batteryTypes) {
    if (batteryChecks[b] != null) drawCheck(page, font, batteryChecks[b], 396.9);
  }

  drawText(page, font, data.accessories, 216, 387.7, 9, 250);

  // Competitive
  drawText(page, font, data.otherBrands, 218, 350.9, 9, 250);
  drawText(page, font, data.uniqueAdvantage, 243, 340.6, 9, 230);

  // Registration
  if (data.registeredWithOtherVendor === "yes") drawCheck(page, font, 293.2, 300.9);
  if (data.registeredWithOtherVendor === "no") drawCheck(page, font, 321.6, 300.9);

  const supportChecks: Record<string, { x: number; y: number }> = {
    techPresentation: { x: 274.6, y: 288.9 },
    siteVisit: { x: 360.6, y: 288.9 },
    pricing: { x: 408.3, y: 288.9 },
    documentation: { x: 448.5, y: 288.9 },
    others: { x: 72.0, y: 277.0 },
  };
  for (const s of data.supportNeeds) {
    const pos = supportChecks[s];
    if (pos) drawCheck(page, font, pos.x, pos.y);
  }

  // Partner signature
  if (data.partnerSignature?.startsWith("data:image")) {
    try {
      const bytes = dataUrlToBytes(data.partnerSignature);
      const img = data.partnerSignature.includes("image/png")
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
      page.drawImage(img, { x: 205, y: 210, width: 130, height: 28 });
    } catch { /* skip */ }
  }
  drawSlashDateSegments(page, font, data.partnerSignatureDate, 97.1, 208.7);

  // Salicru use only
  drawText(page, font, data.dealId, 112, 173.4, 9, 280);
  drawText(page, font, data.registeredBy, 247, 163.0, 9, 220);
  drawSlashDateSegments(page, font, data.registrationDate, 163.1, 151.1);

  const approvalChecks: Record<string, number> = {
    approved: 146.7,
    pending: 197.9,
    rejected: 243.8,
  };
  if (data.approvalStatus && approvalChecks[data.approvalStatus] != null) {
    drawCheck(page, font, approvalChecks[data.approvalStatus], 139.5);
  }
  drawText(page, font, data.remarks, 118, 130.3, 9, 380);

  return pdfDoc.save();
}

export async function fillDealRegistrationPdfBlob(data: DealRegistrationFormData): Promise<Blob> {
  return new Blob([await fillDealRegistrationPdf(data)], { type: "application/pdf" });
}
