import { useState } from "react";
import { Link2, Clock, Eye, FileText, Timer, FilePlus } from "lucide-react";
import { PageHeader, PortalWord } from "@/components/portal/Logo";
import { KpiCard } from "@/components/portal/KpiCard";
import { SubmissionsTable } from "@/components/portal/SubmissionsTable";
import { CreateLinkModal } from "@/components/portal/CreateLinkModal";
import { Button } from "@/components/portal/Button";
import { getDashboard } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { NAVY } from "@/lib/constants";

export function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, loading, refresh } = useApiQuery(() => getDashboard(), []);
  const kpis = data?.stats ?? { total: 0, pending: 0, opened: 0, submitted: 0, expired: 0 };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={<>AHamson Client Document <PortalWord className="text-[1.05em]" /> · Overview</>}
      >
        <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Create Secure Document Link
        </Button>
      </PageHeader>

      <div className="p-6 lg:p-8 w-full space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Total Links Created" value={kpis.total} sub="All time" icon={Link2} accent={NAVY} trend="up" />
          <KpiCard label="Pending Documents" value={kpis.pending} sub="Awaiting client" icon={Clock} accent="#F59E0B" trend="neutral" />
          <KpiCard label="Opened Documents" value={kpis.opened} sub="In progress" icon={Eye} accent="#0EA5E9" trend="neutral" />
          <KpiCard label="Submitted Documents" value={kpis.submitted} sub="Completed" icon={FileText} accent="#10B981" trend="up" />
          <KpiCard label="Expired Links" value={kpis.expired} sub="No longer valid" icon={Timer} accent="#EF4444" trend="neutral" />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 p-12 text-center text-[#94A3B8] text-sm">Loading submissions…</div>
        ) : (
          <SubmissionsTable submissions={data?.submissions ?? []} />
        )}
      </div>

      <CreateLinkModal open={showModal} onClose={() => setShowModal(false)} onCreated={refresh} />
    </>
  );
}
