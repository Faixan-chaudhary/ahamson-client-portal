import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ActivityLogPanel } from "./ActivityLogPanel";
import type { PipelineEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  entry: PipelineEntry | null;
  onClose: () => void;
  onEdit?: (entry: PipelineEntry) => void;
}

function formatDisplayDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(value?: string) {
  if (!value) return "—";
  const num = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num)) return value;
  return `AED ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn(wide ? "sm:col-span-2" : "")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] mb-1">{label}</p>
      <div className="rounded-xl border border-[#0B1F3A]/8 bg-[#F8F9FC] px-3 py-2.5 text-sm text-[#0B1F3A] whitespace-pre-wrap break-words min-h-[40px]">
        {value || "—"}
      </div>
    </div>
  );
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "quoted") return "bg-sky-50 text-sky-700 border-sky-200";
  if (s === "expensive") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "won") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "lost") return "bg-red-50 text-red-700 border-red-200";
  if (s === "on hold") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-[#F4F6FA] text-[#64748B] border-[#0B1F3A]/10";
}

function resolveLogs(entry: PipelineEntry) {
  const logs = entry.activityLogs ?? [];
  if (logs.length) return logs;
  if (!entry.createdAt && !entry.updatedAt) return [];
  const items = [];
  if (entry.createdAt) {
    items.push({
      action: "Created pipeline entry",
      detail: entry.partner || entry.status || "",
      at: entry.createdAt,
    });
  }
  if (entry.updatedAt && entry.updatedAt !== entry.createdAt) {
    items.push({
      action: "Updated pipeline entry",
      detail: entry.status ? `Status: ${entry.status}` : "",
      at: entry.updatedAt,
    });
  }
  return items;
}

export function PipelineEntryViewModal({ open, entry, onClose, onEdit }: Props) {
  if (!entry) {
    return <Modal open={open} onClose={onClose} title="Pipeline Entry" wide><div /></Modal>;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Pipeline Entry Details"
      subtitle={`${entry.partner || "Entry"} · ${formatDisplayDate(entry.quoteDate)}`}
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {entry.status ? (
            <span className={cn(
              "inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
              statusClass(entry.status),
            )}>
              {entry.status}
            </span>
          ) : null}
          {entry.probability ? (
            <span className="text-xs font-semibold text-[#64748B] bg-[#F4F6FA] border border-[#0B1F3A]/8 rounded-full px-2.5 py-1">
              Probability {entry.probability}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Quote Date" value={formatDisplayDate(entry.quoteDate)} />
          <Field label="SP (Sales Person)" value={entry.sp} />
          <Field label="Partner" value={entry.partner} />
          <Field label="End User" value={entry.endUser} />
          <Field label="Country" value={entry.country} />
          <Field label="Brand" value={entry.brand} />
          <Field label="Product" value={entry.product} wide />
          <Field label="Value (AED)" value={formatMoney(entry.valueAed)} />
          <Field label="GP (AED)" value={formatMoney(entry.gpAed)} />
          <Field label="Contact" value={entry.contactName} />
          <Field label="Closure" value={entry.closure} />
          <Field label="Details" value={entry.details} wide />
        </div>

        <ActivityLogPanel logs={resolveLogs(entry)} />
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#0B1F3A]/8">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {onEdit && (
          <Button
            variant="gold"
            onClick={() => {
              onClose();
              onEdit(entry);
            }}
          >
            Edit Entry
          </Button>
        )}
      </div>
    </Modal>
  );
}
