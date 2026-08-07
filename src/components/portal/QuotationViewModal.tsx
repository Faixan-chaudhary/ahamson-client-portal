import { useEffect, useState } from "react";
import { RefreshCw, Workflow } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ActivityLogPanel } from "./ActivityLogPanel";
import { QuotationPdfDownloads } from "./QuotationPdfDownloads";
import { getQuotation } from "@/lib/storage";
import type { Quotation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  quotationId: number | null;
  onClose: () => void;
  onOpenWorkflow?: (id: number) => void;
}

function Field({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] mb-1">{label}</p>
      <div className="rounded-xl border border-[#0B1F3A]/8 bg-[#F8F9FC] px-3 py-2.5 text-sm text-[#0B1F3A] whitespace-pre-wrap break-words min-h-[40px]">
        {value?.trim() ? value : "—"}
      </div>
    </div>
  );
}

function statusTone(status: string) {
  if (status.includes("Lost") || status.includes("Not Approved")) return "bg-red-50 text-red-700 border-red-200";
  if (status.includes("Closed") || status.includes("Approved") || status.includes("Delivered")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status.includes("Pending")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (status.includes("Submitted") || status.includes("Placed")) return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-[#F8F9FC] text-[#0B1F3A] border-[#0B1F3A]/10";
}

export function QuotationViewModal({ open, quotationId, onClose, onOpenWorkflow }: Props) {
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !quotationId) {
      setQuote(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getQuotation(quotationId)
      .then(data => {
        if (!cancelled) setQuote(data);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load quotation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, quotationId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={quote?.quoteNumber || "Quotation details"}
      subtitle={quote ? `${quote.phase} · ${quote.status}` : loading ? "Loading…" : "View quotation"}
    >
      {loading && !quote && (
        <div className="flex items-center gap-2 text-sm text-[#64748B] py-8 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading quotation…
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {quote && (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border bg-[#F4F6FA] text-[#0B1F3A] border-[#0B1F3A]/10">
              {quote.phase}
            </span>
            <span className={cn(
              "inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border",
              statusTone(quote.status),
            )}>
              {quote.status}
            </span>
          </div>

          {!!quote.allowedActions?.length && (
            <div className={cn(
              "rounded-xl border px-3 py-2.5 text-sm",
              quote.allowedActions.includes("finance-review") || quote.allowedActions.includes("sales-head-review")
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-[#FFF8F0] border-[#F7931E]/30 text-[#0B1F3A]",
            )}>
              <p className="font-semibold text-[12px] uppercase tracking-[0.08em] mb-0.5">Your next step</p>
              <p>{quote.actionHint || "Open workflow to continue this quotation"}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Quote date" value={quote.quotationDate} />
            <Field label="Sales person" value={quote.salesPerson} />
            <Field label="Partner" value={quote.partner} />
            <Field label="End user" value={quote.endUser} />
            <Field label="Country" value={quote.country} />
            <Field label="Contact" value={quote.contactPerson} />
            <Field label="Brand" value={quote.brand} />
            <Field label="Probability" value={quote.probability} />
            <Field label="Products" value={quote.products} wide />
            <Field label="Deal value" value={quote.dealValue} />
            <Field label="GP" value={quote.gpValue} />
            <Field label="Closure date" value={quote.closureDate} />
            <Field label="Submission date" value={quote.quotationSubmissionDate || quote.formalSubmissionDate} />
            <Field label="Details" value={quote.details} wide />
            {quote.closureReason && (
              <Field label="Closure reason" value={`${quote.closureReason}${quote.closureRemarks ? ` — ${quote.closureRemarks}` : ""}`} wide />
            )}
            {quote.oem && <Field label="OEM" value={quote.oem} />}
            {quote.orderDetails && <Field label="Order details" value={quote.orderDetails} wide />}
          </div>

          <ActivityLogPanel
            logs={
              quote.activityLogs?.length
                ? quote.activityLogs
                : quote.createdAt
                  ? [{ action: "Created quotation", detail: quote.status, at: quote.createdAt }]
                  : []
            }
          />
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 mt-4 pt-3 border-t border-[#0B1F3A]/8">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {quote && (
          <QuotationPdfDownloads
            quote={quote}
            size="compact"
            onError={(message) => setError(message)}
          />
        )}
        {quote && onOpenWorkflow && (
          <Button
            variant="gold"
            icon={<Workflow className="w-4 h-4" />}
            onClick={() => onOpenWorkflow(quote.id)}
          >
            {quote.allowedActions?.includes("finance-review") || quote.allowedActions?.includes("sales-head-review")
              ? "Review & Approve"
              : quote.allowedActions?.length
                ? "Continue workflow"
                : "Open workflow"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
