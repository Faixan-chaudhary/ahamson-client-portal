import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "./Button";
import { exportQuotationPdf } from "@/lib/storage";
import type { Quotation } from "@/lib/types";

type Props = {
  quote: Quotation;
  /** Compact for modal footer; default for page header */
  size?: "default" | "compact";
  onError?: (message: string) => void;
};

export function QuotationPdfDownloads({ quote, size = "default", onError }: Props) {
  const [busy, setBusy] = useState<"self" | "linked" | "">("");
  const isFormal = (quote.phase || "").toLowerCase() === "formal";
  const linkedId = isFormal ? quote.parentQuoteId : quote.childQuoteId;
  const linkedNumber = isFormal ? quote.parentQuoteNumber : quote.childQuoteNumber;
  const linkedPhase = isFormal ? "budgetary" : "formal";

  async function download(kind: "self" | "linked", id: number, number?: string, phase?: string) {
    setBusy(kind);
    try {
      await exportQuotationPdf(id, number, phase);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setBusy("");
    }
  }

  const selfLabel = isFormal
    ? (busy === "self" ? "Formal…" : size === "compact" ? "Formal PDF" : "Download Formal PDF")
    : (busy === "self" ? "Budgetary…" : size === "compact" ? "Budgetary PDF" : "Download Budgetary PDF");

  const linkedLabel = isFormal
    ? (busy === "linked" ? "Budgetary…" : size === "compact" ? "Budgetary PDF" : "Download Budgetary PDF")
    : (busy === "linked" ? "Formal…" : size === "compact" ? "Formal PDF" : "Download Formal PDF");

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <Button
        variant="gold"
        icon={<Download className="w-4 h-4" />}
        disabled={!!busy}
        title={`${isFormal ? "Formal" : "Budgetary"} quotation PDF`}
        onClick={() => download("self", quote.id, quote.quoteNumber, quote.phase)}
      >
        {selfLabel}
      </Button>
      {linkedId != null && (
        <Button
          variant="outline"
          icon={<Download className="w-4 h-4" />}
          disabled={!!busy}
          title={
            linkedNumber
              ? `Download linked ${linkedPhase} quote ${linkedNumber}`
              : `Download linked ${linkedPhase} quotation`
          }
          onClick={() => download("linked", linkedId, linkedNumber, linkedPhase)}
        >
          {linkedLabel}
        </Button>
      )}
    </div>
  );
}
