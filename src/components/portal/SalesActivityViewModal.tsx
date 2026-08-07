import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { ActivityLogPanel } from "./ActivityLogPanel";
import type { SalesActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  activity: SalesActivity | null;
  onClose: () => void;
  onEdit?: (activity: SalesActivity) => void;
}

function formatDisplayDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8] mb-1">{label}</p>
      <div className="rounded-xl border border-[#0B1F3A]/8 bg-[#F8F9FC] px-3 py-2.5 text-sm text-[#0B1F3A] whitespace-pre-wrap break-words min-h-[40px]">
        {value || "—"}
      </div>
    </div>
  );
}

function resolveLogs(activity: SalesActivity) {
  const logs = activity.activityLogs ?? [];
  if (logs.length) return logs;
  if (!activity.createdAt && !activity.updatedAt) return [];
  const items = [];
  if (activity.createdAt) {
    items.push({
      action: "Created sales activity",
      detail: activity.customerName || "",
      at: activity.createdAt,
    });
  }
  if (activity.updatedAt && activity.updatedAt !== activity.createdAt) {
    items.push({
      action: "Updated sales activity",
      detail: activity.customerName || "",
      at: activity.updatedAt,
    });
  }
  return items;
}

export function SalesActivityViewModal({ open, activity, onClose, onEdit }: Props) {
  if (!activity) {
    return <Modal open={open} onClose={onClose} title="Sales Activity" wide><div /></Modal>;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Sales Activity Details"
      subtitle={`${activity.customerName || "Meeting"} · ${formatDisplayDate(activity.meetingDate)}`}
    >
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Sales Person" value={activity.salesPerson} />
          <Field label="Meeting Date" value={formatDisplayDate(activity.meetingDate)} />
          <Field label="Customer Name" value={activity.customerName} />
          <Field label="Contact Person" value={activity.contactPerson} />
          <Field label="Contact Number" value={activity.contactNumber} />
          <Field label="Meeting outputs" value={activity.meetingOutputs} wide />
        </div>

        <ActivityLogPanel logs={resolveLogs(activity)} />
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#0B1F3A]/8">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {onEdit && (
          <Button
            variant="gold"
            onClick={() => {
              onClose();
              onEdit(activity);
            }}
          >
            Edit Activity
          </Button>
        )}
      </div>
    </Modal>
  );
}
