import { useState } from "react";
import { Link2, CheckCircle, RefreshCw, Timer, User, Mail, Building2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CopyButton } from "./CopyButton";
import { FormField, Input } from "./FormField";
import { getDealLinkFromApi } from "@/lib/storage";
import { formatLinkExpiry, useAppConfig } from "@/hooks/useAppConfig";

interface CreateDealLinkModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateDealLinkModal({ open, onClose, onCreated }: CreateDealLinkModalProps) {
  const { linkExpireHours } = useAppConfig();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setCompany("");
    setContact("");
    setEmail("");
    setGenerated("");
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function generate() {
    if (!company || !contact || !email) return;
    setLoading(true);
    setError("");
    try {
      const res = await getDealLinkFromApi({
        partnerCompanyName: company,
        contactPerson: contact,
        contactEmail: email,
      });
      setGenerated(res.link);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Deal Registration Link"
      subtitle="Generate a time-limited link for partners to fill the deal form"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Partner Company Name" required half>
            <Input value={company} onChange={setCompany} placeholder="Partner company" icon={<Building2 className="w-4 h-4" />} />
          </FormField>
          <FormField label="Contact Person Name" required half>
            <Input value={contact} onChange={setContact} placeholder="Full name" icon={<User className="w-4 h-4" />} />
          </FormField>
        </div>
        <FormField label="Contact Email" required>
          <Input value={email} onChange={setEmail} type="email" placeholder="partner@company.ae" icon={<Mail className="w-4 h-4" />} />
        </FormField>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!generated ? (
          <Button
            variant="gold"
            onClick={generate}
            disabled={!company || !contact || !email || loading}
            className="w-full"
            icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          >
            {loading ? "Generating..." : "Generate Deal Link"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-emerald-700 text-sm font-semibold">Deal link generated successfully</p>
                <p className="text-emerald-600 text-xs flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  This link will expire in {formatLinkExpiry(linkExpireHours)}.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#F8F9FC] border border-[#0B1F3A]/12 rounded-xl px-3 py-2 text-[11px] text-[#0B1F3A] font-['JetBrains_Mono'] truncate">
                {generated}
              </div>
              <CopyButton text={generated} label="Copy Link" copiedLabel="Copied!" appearance="solid" className="flex-shrink-0" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
