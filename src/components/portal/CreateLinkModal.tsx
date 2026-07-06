import { useState } from "react";
import { FilePlus, Link2, CheckCircle, RefreshCw, Timer, User, Mail, Phone, Building2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CopyButton } from "./CopyButton";
import { FormField, Input, Textarea } from "./FormField";
import { createSecureLink, getClientLink } from "@/lib/storage";

interface CreateLinkModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateLinkModal({ open, onClose, onCreated }: CreateLinkModalProps) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setCompany(""); setContact(""); setEmail(""); setPhone(""); setNotes("");
    setGenerated(""); 
  }

  function handleClose() {
    reset(); onClose();
  }

  function generate() {
    if (!company || !contact || !email) return;
    setLoading(true);
    setTimeout(() => {
      const sub = createSecureLink({ clientCompany: company, contactPerson: contact, contactEmail: email, phone, internalNotes: notes });
      const link = getClientLink(sub.token);
      setGenerated(link);
      setLoading(false);
      onCreated?.();
    }, 700);
  }

  return (
    <Modal open={open} onClose={handleClose}
      title="Create Secure Document Link"
      subtitle="Generate a time-limited link for client document submission"
      icon={<div className="w-8 h-8 rounded-lg bg-[#F7931E]/20 flex items-center justify-center"><FilePlus className="w-4 h-4 text-[#F7931E]" /></div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Client Company Name" required>
            <Input value={company} onChange={setCompany} placeholder="Al Noor Trading LLC" icon={<Building2 className="w-4 h-4" />} />
          </FormField>
          <FormField label="Contact Person Name" required>
            <Input value={contact} onChange={setContact} placeholder="Ahmed Al Mansouri" icon={<User className="w-4 h-4" />} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Contact Email" required>
            <Input value={email} onChange={setEmail} type="email" placeholder="client@company.ae" icon={<Mail className="w-4 h-4" />} />
          </FormField>
          <FormField label="Phone Number">
            <Input value={phone} onChange={setPhone} placeholder="+971 50 000 0000" icon={<Phone className="w-4 h-4" />} />
          </FormField>
        </div>
        <FormField label="Internal Notes">
          <Textarea value={notes} onChange={setNotes} placeholder="Optional notes for internal reference..." />
        </FormField>

        {!generated ? (
          <Button variant="gold" onClick={generate} disabled={!company || !contact || !email || loading} className="w-full" icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}>
            {loading ? "Generating..." : "Generate Link"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-emerald-700 text-sm font-semibold">Link generated successfully</p>
                <p className="text-emerald-600 text-xs flex items-center gap-1"><Timer className="w-3 h-3" />This link will expire in 2 hours.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#F8F9FC] border border-[#0B1F3A]/12 rounded-xl px-3 py-2.5 text-[11px] text-[#0B1F3A] font-['JetBrains_Mono'] truncate">{generated}</div>
              <CopyButton text={generated} label="Copy Link" copiedLabel="Copied!" appearance="solid" className="flex-shrink-0" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
