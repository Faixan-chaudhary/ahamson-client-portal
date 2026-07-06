import { useState, useMemo } from "react";
import { Link2, Clock, Eye, FileText, Timer, FilePlus, Bell } from "lucide-react";
import { AdminLayout } from "@/components/portal/AdminLayout";
import { PageHeader, PortalWord } from "@/components/portal/Logo";
import { KpiCard } from "@/components/portal/KpiCard";
import { SubmissionsTable } from "@/components/portal/SubmissionsTable";
import { CreateLinkModal } from "@/components/portal/CreateLinkModal";
import { Button } from "@/components/portal/Button";
import { getSubmissions } from "@/lib/storage";
import { GOLD, NAVY } from "@/lib/constants";

export function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const submissions = useMemo(() => getSubmissions(), [refresh]);

  const kpis = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    opened: submissions.filter(s => s.status === "opened").length,
    submitted: submissions.filter(s => s.status === "submitted").length,
    expired: submissions.filter(s => s.status === "expired").length,
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle={<>Ahamson Client Document <PortalWord className="text-[1.05em]" /> · Overview</>}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button className="relative w-9 h-9 rounded-xl bg-[#F4F6FA] border border-[#0B1F3A]/8 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#64748B]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ background: GOLD }} />
          </button>
          <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Create Secure Document Link
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 lg:p-8 w-full space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Total Links Created" value={kpis.total} sub="All time" icon={Link2} accent={NAVY} trend="up" />
          <KpiCard label="Pending Documents" value={kpis.pending} sub="Awaiting client" icon={Clock} accent="#F59E0B" trend="neutral" />
          <KpiCard label="Opened Documents" value={kpis.opened} sub="In progress" icon={Eye} accent="#0EA5E9" trend="neutral" />
          <KpiCard label="Submitted Documents" value={kpis.submitted} sub="Completed" icon={FileText} accent="#10B981" trend="up" />
          <KpiCard label="Expired Links" value={kpis.expired} sub="No longer valid" icon={Timer} accent="#EF4444" trend="neutral" />
        </div>

        <SubmissionsTable submissions={submissions} />
      </div>

      <CreateLinkModal open={showModal} onClose={() => setShowModal(false)} onCreated={() => setRefresh(r => r + 1)} />
    </AdminLayout>
  );
}
