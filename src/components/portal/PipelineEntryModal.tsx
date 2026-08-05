import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FormField, Input, Textarea } from "./FormField";
import type { PipelineEntry, PipelineEntryInput } from "@/lib/types";

const emptyForm = (): PipelineEntryInput => ({
  quoteDate: new Date().toISOString().slice(0, 10),
  sp: "",
  partner: "",
  endUser: "",
  country: "UAE",
  brand: "Salicru",
  product: "",
  valueAed: "",
  gpAed: "",
  contactName: "",
  closure: "",
  probability: "",
  status: "Quoted",
  details: "",
});

interface PipelineEntryModalProps {
  open: boolean;
  entry?: PipelineEntry | null;
  onClose: () => void;
  onSave: (input: PipelineEntryInput) => Promise<void>;
}

export function PipelineEntryModal({ open, entry, onClose, onSave }: PipelineEntryModalProps) {
  const [form, setForm] = useState<PipelineEntryInput>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setForm({
        quoteDate: entry.quoteDate ?? "",
        sp: entry.sp,
        partner: entry.partner,
        endUser: entry.endUser,
        country: entry.country,
        brand: entry.brand,
        product: entry.product,
        valueAed: entry.valueAed,
        gpAed: entry.gpAed,
        contactName: entry.contactName,
        closure: entry.closure,
        probability: entry.probability,
        status: entry.status,
        details: entry.details,
      });
    } else {
      setForm(emptyForm());
    }
    setError("");
  }, [open, entry]);

  function patch(partial: Partial<PipelineEntryInput>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  async function submit() {
    if (!form.partner.trim()) {
      setError("Partner is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={entry ? "Edit Pipeline Entry" : "Add Pipeline Entry"}
      subtitle="AHamson sales pipeline — same fields as the Excel template"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <FormField label="Quote Date" half>
          <Input type="date" value={form.quoteDate ?? ""} onChange={v => patch({ quoteDate: v })} />
        </FormField>
        <FormField label="SP (Sales Person)" half>
          <Input value={form.sp} onChange={v => patch({ sp: v })} placeholder="FD" />
        </FormField>
        <FormField label="Partner" required half>
          <Input value={form.partner} onChange={v => patch({ partner: v })} placeholder="Partner company" />
        </FormField>
        <FormField label="End User" half>
          <Input value={form.endUser} onChange={v => patch({ endUser: v })} placeholder="End customer / project" />
        </FormField>
        <FormField label="Country" half>
          <Input value={form.country} onChange={v => patch({ country: v })} placeholder="UAE" />
        </FormField>
        <FormField label="Brand" half>
          <Input value={form.brand} onChange={v => patch({ brand: v })} options={["Salicru", "Hubnetix"]} />
        </FormField>
        <FormField label="Product">
          <Textarea value={form.product} onChange={v => patch({ product: v })} placeholder="Product models & quantities" rows={2} />
        </FormField>
        <FormField label="Value (AED)" half>
          <Input value={form.valueAed} onChange={v => patch({ valueAed: v })} placeholder="564790" />
        </FormField>
        <FormField label="GP (AED)" half>
          <Input value={form.gpAed} onChange={v => patch({ gpAed: v })} placeholder="40000" />
        </FormField>
        <FormField label="Contact Name" half>
          <Input value={form.contactName} onChange={v => patch({ contactName: v })} placeholder="Contact" />
        </FormField>
        <FormField label="Closure" half>
          <Input value={form.closure} onChange={v => patch({ closure: v })} placeholder="Aug" />
        </FormField>
        <FormField label="Probability" half>
          <Input value={form.probability} onChange={v => patch({ probability: v })} placeholder="25%" />
        </FormField>
        <FormField label="Status" half>
          <Input value={form.status} onChange={v => patch({ status: v })} options={["Quoted", "Expensive", "Won", "Lost", "On Hold"]} />
        </FormField>
        <FormField label="Details">
          <Textarea value={form.details} onChange={v => patch({ details: v })} placeholder="Notes" rows={2} />
        </FormField>
      </div>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="gold"
          onClick={submit}
          disabled={loading}
          icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        >
          {loading ? "Saving…" : entry ? "Save Changes" : "Add Entry"}
        </Button>
      </div>
    </Modal>
  );
}
