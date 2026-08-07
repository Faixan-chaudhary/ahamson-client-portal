import { useState } from "react";
import { Link2, Clock, Eye, FileText, Timer, FilePlus, ClipboardPen } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { GreetingSubtitle } from "@/components/portal/GreetingSubtitle";
import { KpiCard } from "@/components/portal/KpiCard";
import { SubmissionsTable } from "@/components/portal/SubmissionsTable";
import { DealsTable } from "@/components/portal/DealsTable";
import { CreateLinkModal } from "@/components/portal/CreateLinkModal";
import { CreateDealLinkModal } from "@/components/portal/CreateDealLinkModal";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { toFilterParam } from "@/components/portal/TableFiltersPopover";
import { getDashboard, getDeals, getSubmissions } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { NAVY } from "@/lib/constants";
import { can } from "@/lib/permissions";

export function DashboardPage() {
  const canDocs = can.manageDocumentLinks();
  const canDeals = can.manageDealLinks();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDealLinkModal, setShowDealLinkModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dealSearch, setDealSearch] = useState("");
  const [dealStatusFilter, setDealStatusFilter] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(search);
  const debouncedDealSearch = useDebouncedValue(dealSearch);

  const { data, loading, error, refresh } = useApiQuery(() => getDashboard(), []);
  const { data: submissionsData, loading: submissionsLoading, error: submissionsError, refresh: refreshSubmissions } = useApiQuery(
    () => getSubmissions({ search: debouncedSearch, status: toFilterParam(statusFilter) }),
    [debouncedSearch, statusFilter],
  );
  const { data: dealsData, loading: dealsLoading, error: dealsError, refresh: refreshDeals } = useApiQuery(
    () => getDeals({ search: debouncedDealSearch, status: toFilterParam(dealStatusFilter) }),
    [debouncedDealSearch, dealStatusFilter],
  );

  const kpis = data?.stats ?? { total: 0, pending: 0, opened: 0, submitted: 0, expired: 0 };

  function handleCreated() {
    refresh();
    refreshSubmissions();
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={<GreetingSubtitle />}
      >
        {(canDocs || canDeals) && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canDeals && (
              <Button
                variant="outline"
                icon={<ClipboardPen className="w-4 h-4" />}
                onClick={() => setShowDealLinkModal(true)}
              >
                <span className="sm:hidden">Deal Link</span>
                <span className="hidden sm:inline">Create Deal Link</span>
              </Button>
            )}
            {canDocs && (
              <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowLinkModal(true)}>
                <span className="sm:hidden">Doc Link</span>
                <span className="hidden sm:inline">Create Document Link</span>
              </Button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full space-y-4 sm:space-y-6">
        <ApiErrorAlert
          message={error ?? submissionsError ?? dealsError}
          onRetry={() => { refresh(); refreshSubmissions(); refreshDeals(); }}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
          <KpiCard label="Total Links Created" value={kpis.total} sub="All time" icon={Link2} accent={NAVY} trend="up" />
          <KpiCard label="Pending Documents" value={kpis.pending} sub="Awaiting client" icon={Clock} accent="#F59E0B" trend="neutral" />
          <KpiCard label="Opened Documents" value={kpis.opened} sub="In progress" icon={Eye} accent="#0EA5E9" trend="neutral" />
          <KpiCard label="Submitted Documents" value={kpis.submitted} sub="Completed" icon={FileText} accent="#10B981" trend="up" />
          <KpiCard label="Expired Links" value={kpis.expired} sub="No longer valid" icon={Timer} accent="#EF4444" trend="neutral" />
        </div>

        <DealsTable
          deals={dealsData?.items ?? []}
          loading={dealsLoading}
          search={dealSearch}
          statusFilter={dealStatusFilter}
          total={dealsData?.total}
          onSearchChange={setDealSearch}
          onStatusChange={setDealStatusFilter}
        />

        <SubmissionsTable
          submissions={submissionsData?.items ?? []}
          loading={submissionsLoading}
          search={search}
          statusFilter={statusFilter}
          total={submissionsData?.total}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
      </div>

      <CreateLinkModal open={showLinkModal} onClose={() => setShowLinkModal(false)} onCreated={handleCreated} />
      <CreateDealLinkModal open={showDealLinkModal} onClose={() => setShowDealLinkModal(false)} onCreated={refreshDeals} />
    </>
  );
}
