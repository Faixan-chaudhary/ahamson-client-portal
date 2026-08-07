import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FormField, Input, Textarea } from "./FormField";
import { addSalesActivity, saveSalesActivity } from "@/lib/storage";
import { getStoredUser } from "@/lib/auth";
import type { SalesActivity, SalesActivityInput } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editing?: SalesActivity | null;
}

function empty(): SalesActivityInput {
  return {
    salesPerson: getStoredUser()?.name || "",
    customerName: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    contactPerson: "",
    contactNumber: "",
    meetingOutputs: "",
  };
}

export function SalesActivityModal({ open, onClose, onSaved, editing }: Props) {
  const [form, setForm] = useState<SalesActivityInput>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        salesPerson: editing.salesPerson,
        customerName: editing.customerName,
        meetingDate: editing.meetingDate,
        contactPerson: editing.contactPerson,
        contactNumber: editing.contactNumber,
        meetingOutputs: editing.meetingOutputs,
      });
    } else {
      setForm(empty());
    }
    setError("");
  }, [open, editing]);

  function patch(partial: Partial<SalesActivityInput>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  async function submit() {
    if (!form.customerName?.trim() || !form.meetingDate?.trim()) {
      setError("Customer name and meeting date are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (editing) {
        await saveSalesActivity(editing.id, form);
      } else {
        await addSalesActivity(form);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Sales Activity" : "Add Sales Activity"}
      subtitle="Same fields as Sales Activities template.xlsx"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Sales Person" half>
            <Input value={form.salesPerson || ""} onChange={v => patch({ salesPerson: v })} />
          </FormField>
          <FormField label="Meeting Date" required half>
            <Input type="date" value={form.meetingDate || ""} onChange={v => patch({ meetingDate: v })} />
          </FormField>
          <FormField label="Customer Name" required>
            <Input value={form.customerName || ""} onChange={v => patch({ customerName: v })} />
          </FormField>
          <FormField label="Customer Contact Person" half>
            <Input value={form.contactPerson || ""} onChange={v => patch({ contactPerson: v })} />
          </FormField>
          <FormField label="Contact Number" half>
            <Input value={form.contactNumber || ""} onChange={v => patch({ contactNumber: v })} />
          </FormField>
        </div>
        <FormField label="Meeting outputs">
          <Textarea value={form.meetingOutputs || ""} onChange={v => patch({ meetingOutputs: v })} rows={3} />
        </FormField>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          variant="gold"
          className="w-full"
          disabled={loading}
          icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
          onClick={submit}
        >
          {loading ? "Saving…" : editing ? "Update Activity" : "Save Activity"}
        </Button>
      </div>
    </Modal>
  );
}
