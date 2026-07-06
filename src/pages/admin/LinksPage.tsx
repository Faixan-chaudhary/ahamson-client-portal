import { useMemo, useState } from "react";
import { FilePlus, Link2 } from "lucide-react";
import { AdminLayout } from "@/components/portal/AdminLayout";
import { PageHeader } from "@/components/portal/Logo";
import { CreateLinkModal } from "@/components/portal/CreateLinkModal";
import { CopyButton } from "@/components/portal/CopyButton";
import { Button } from "@/components/portal/Button";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { getSubmissions, getClientLink } from "@/lib/storage";
import { formatDateTime } from "@/lib/utils";

export function LinksPage() {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const submissions = useMemo(() => getSubmissions(), [refresh]);

  return (
    <AdminLayout>
      <PageHeader title="Document Links" subtitle="Create and manage secure client document links">
        <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Create Secure Document Link
        </Button>
      </PageHeader>

      <div className="p-6 lg:p-8 w-full">
        <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 overflow-hidden portal-panel">
          <div className="px-6 py-4 border-b border-[#0B1F3A]/6">
            <h3 className="font-['Playfair_Display'] font-bold text-[#0B1F3A]">Active Document Links</h3>
            <p className="text-[#94A3B8] text-xs mt-1">{submissions.length} link{submissions.length !== 1 ? "s" : ""} created</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FC] text-[#64748B] text-[11px] uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Client Company</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">Secure Link</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Expires</th>
                  <th className="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B1F3A]/5">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                      No links yet. Create your first secure document link.
                    </td>
                  </tr>
                ) : submissions.map(s => (
                  <tr key={s.id} className="hover:bg-[#F8F9FC]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0B1F3A]">{s.clientCompany}</td>
                    <td className="px-4 py-4 text-[#64748B]">{s.contactPerson}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[#64748B] text-xs max-w-[280px] truncate">
                        <Link2 className="w-3.5 h-3.5 flex-shrink-0 text-[#F7931E]" />
                        <span className="truncate">{getClientLink(s.token)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-4 text-[#94A3B8] text-xs">{formatDateTime(s.expiresAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <CopyButton text={getClientLink(s.token)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateLinkModal open={showModal} onClose={() => setShowModal(false)} onCreated={() => setRefresh(r => r + 1)} />
    </AdminLayout>
  );
}
