import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FormField, Input, Textarea } from "./FormField";
import { addQuotation } from "@/lib/storage";
import { getStoredUser } from "@/lib/auth";
import type { QuotationInput } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: number) => void;
}

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const empty = (): QuotationInput => ({
  quotationDate: todayLocalISO(),
  salesPerson: getStoredUser()?.name || "",
  partner: "",
  endUser: "",
  country: "",
  brand: "",
  products: "",
  dealValue: "",
  gpValue: "",
  contactPerson: "",
  closureDate: "",
  probability: "",
  details: "",
  siAttachmentName: "",
  siAttachmentNote: "",
});

export function CreateQuotationModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<QuotationInput>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(empty());
      setError("");
    }
  }, [open]);

  function patch(partial: Partial<QuotationInput>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  async function submit() {
    if (!form.partner?.trim() || !form.endUser?.trim()) {
      setError("Partner and End User are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await addQuotation(form);
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quotation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide title="New Budgetary Quotation" subtitle="Step 2 — Review requirements & prepare quotation">
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Quotation Date" half>
            <Input
              type="date"
              name="quotationDate"
              autoComplete="off"
              value={form.quotationDate || ""}
              onChange={v => patch({ quotationDate: v })}
            />
          </FormField>
          <FormField label="Sales Person" half>
            <Input value={form.salesPerson || ""} onChange={v => patch({ salesPerson: v })} />
          </FormField>
          <FormField label="Partner (SI)" required half>
            <Input value={form.partner || ""} onChange={v => patch({ partner: v })} placeholder="System Integrator / Partner" />
          </FormField>
          <FormField label="End User" required half>
            <Input value={form.endUser || ""} onChange={v => patch({ endUser: v })} />
          </FormField>
          <FormField label="Country" half>
            <Input value={form.country || ""} onChange={v => patch({ country: v })} />
          </FormField>
          <FormField label="Brand" half>
            <Input value={form.brand || ""} onChange={v => patch({ brand: v })} />
          </FormField>
          <FormField label="Products">
            <Input value={form.products || ""} onChange={v => patch({ products: v })} />
          </FormField>
          <FormField label="Deal Value" half>
            <Input value={form.dealValue || ""} onChange={v => patch({ dealValue: v })} placeholder="AED / USD" />
          </FormField>
          <FormField label="GP Value" half>
            <Input value={form.gpValue || ""} onChange={v => patch({ gpValue: v })} />
          </FormField>
          <FormField label="Contact Person" half>
            <Input value={form.contactPerson || ""} onChange={v => patch({ contactPerson: v })} />
          </FormField>
          <FormField label="Closure Date" half>
            <Input
              type="date"
              name="closureDate"
              autoComplete="off"
              value={form.closureDate || ""}
              onChange={v => patch({ closureDate: v })}
            />
          </FormField>
          <FormField label="Probability" half>
            <Input value={form.probability || ""} onChange={v => patch({ probability: v })} placeholder="e.g. 60%" />
          </FormField>
          <FormField label="SI email attachment name" half>
            <Input value={form.siAttachmentName || ""} onChange={v => patch({ siAttachmentName: v })} placeholder="email.pdf / RFQ ref" />
          </FormField>
        </div>
        <FormField label="Details">
          <Textarea value={form.details || ""} onChange={v => patch({ details: v })} rows={3} />
        </FormField>
        <FormField label="Attachment notes">
          <Textarea value={form.siAttachmentNote || ""} onChange={v => patch({ siAttachmentNote: v })} rows={2} />
        </FormField>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          variant="gold"
          className="w-full"
          disabled={loading}
          icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
          onClick={submit}
        >
          {loading ? "Saving…" : "Save as Budgetary Quote Prepared"}
        </Button>
      </div>
    </Modal>
  );
}
