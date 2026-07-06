import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Download, Eye as ViewIcon } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PortalSelect } from "./Select";
import { CopyButton } from "./CopyButton";
import { getClientLink } from "@/lib/storage";
import { formatDateTime } from "@/lib/utils";
import type { Submission } from "@/lib/types";

interface SubmissionsTableProps {
  submissions: Submission[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "opened", label: "Opened" },
  { value: "submitted", label: "Submitted" },
  { value: "expired", label: "Expired" },
];

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase();
    return (s.clientCompany.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      && (statusFilter === "all" || s.status === statusFilter);
  });

  return (
    <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 overflow-hidden portal-panel">
      <div className="px-6 py-4 border-b border-[#0B1F3A]/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-['Playfair_Display'] font-bold text-[#0B1F3A]">Document Submissions</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="pl-9 pr-3 py-2 rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none z-10" />
            <PortalSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              withLeadingIcon
              className="w-44"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FC] text-[#64748B] text-[11px] uppercase tracking-wider">
              <th className="text-left px-6 py-3 font-semibold">Client Company</th>
              <th className="text-left px-4 py-3 font-semibold">Contact Person</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Created At</th>
              <th className="text-left px-4 py-3 font-semibold">Expires At</th>
              <th className="text-left px-4 py-3 font-semibold">Submitted At</th>
              <th className="text-right px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0B1F3A]/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#94A3B8]">No submissions found</td>
              </tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-[#F8F9FC]/60 transition-colors">
                <td className="px-6 py-4 font-semibold text-[#0B1F3A]">{s.clientCompany}</td>
                <td className="px-4 py-4 text-[#64748B]">{s.contactPerson}</td>
                <td className="px-4 py-4 text-[#64748B]">{s.email}</td>
                <td className="px-4 py-4"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-4 text-[#94A3B8] text-xs">{formatDateTime(s.createdAt)}</td>
                <td className="px-4 py-4 text-[#94A3B8] text-xs">{formatDateTime(s.expiresAt)}</td>
                <td className="px-4 py-4 text-[#94A3B8] text-xs">{s.submittedAt ? formatDateTime(s.submittedAt) : "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => navigate(`/admin/submissions/${s.id}`)} title="View" className="w-8 h-8 rounded-lg hover:bg-[#F4F6FA] flex items-center justify-center text-[#64748B] hover:text-[#0B1F3A]">
                      <ViewIcon className="w-4 h-4" />
                    </button>
                    <CopyButton text={getClientLink(s.token)} variant="icon" />
                    <button title="Download PDF" className="w-8 h-8 rounded-lg hover:bg-[#F4F6FA] flex items-center justify-center text-[#64748B] hover:text-[#0B1F3A] opacity-50 cursor-not-allowed">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
