import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Download, Eye, FilePlus, RefreshCw, Workflow } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { CreateQuotationModal } from "@/components/portal/CreateQuotationModal";
import { QuotationViewModal } from "@/components/portal/QuotationViewModal";
import { QuotationStatsStrip } from "@/components/portal/QuotationStatsStrip";
import { TableFiltersPopover, toFilterParam } from "@/components/portal/TableFiltersPopover";
import {
  DataTable,
  DataTableActions,
  DataTableBody,
  DataTableCard,
  DataTableFilters,
  DataTableHead,
  DataTableHeadRow,
  DataTableIconButton,
  DataTableRow,
  DataTableSearch,
  DataTableState,
  DataTableTd,
  DataTableTh,
  DataTableTitle,
  DataTableToolbar,
  DataTableWrap,
} from "@/components/portal/DataTable";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getStoredUser } from "@/lib/auth";
import { exportQuotationsSheet, getQuotationStats, getQuotations } from "@/lib/storage";
import { can } from "@/lib/permissions";
import {
  ALL_QUOTATION_STATUSES,
  defaultQuotationQueue,
  isApprovalAction,
  type QuotationQueueKey,
} from "@/lib/quotation-status";
import { cn } from "@/lib/utils";

const PHASE_OPTIONS = [
  { value: "budgetary", label: "Budgetary" },
  { value: "formal", label: "Formal" },
];

const STATUS_OPTIONS = ALL_QUOTATION_STATUSES;

function statusTone(status: string) {
  if (status.includes("Lost") || status.includes("Not Approved")) return "bg-red-50 text-red-700 border-red-200";
  if (status.includes("Closed") || status.includes("Approved") || status.includes("Delivered")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status.includes("Pending")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (status.includes("Submitted") || status.includes("Placed")) return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-[#F8F9FC] text-[#0B1F3A] border-[#0B1F3A]/10";
}

const QUEUE_LABELS: Record<QuotationQueueKey, string> = {
  action: "My Action Queue",
  finance: "Finance Queue",
  sales_head: "Sales Head Queue",
  sales: "Sales Next Steps",
};

export function QuotationsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canCreate = can.createQuotation();
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [queue, setQueue] = useState<QuotationQueueKey | "">(() => defaultQuotationQueue(user?.role));
  const [showCreate, setShowCreate] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  /** Applied to API — updated by debounce, or immediately on clear/create. */
  const [listSearch, setListSearch] = useState("");

  useEffect(() => {
    setListSearch(debouncedSearch);
  }, [debouncedSearch]);

  const filters = {
    search: listSearch,
    phase: toFilterParam(phaseFilter),
    status: toFilterParam(statusFilter),
    queue: queue || undefined,
  };

  const { data, setData, loading, error, refresh } = useApiQuery(
    () => getQuotations(filters),
    [listSearch, phaseFilter, statusFilter, queue],
  );
  const { data: stats, refresh: refreshStats } = useApiQuery(() => getQuotationStats(), []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportQuotationsSheet(filters);
    } finally {
      setExporting(false);
    }
  }

  function handleRefresh() {
    refresh();
    refreshStats();
  }

  const hasActiveFilters = Boolean(
    search.trim() || phaseFilter.length || statusFilter.length || queue,
  );

  function clearFilters() {
    setSearch("");
    setListSearch("");
    setPhaseFilter([]);
    setStatusFilter([]);
    setQueue("");
  }

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Budgetary & Formal quotation workflow — Sales, Finance, Sales Head"
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            disabled={exporting}
            onClick={handleExport}
          >
            {exporting ? "Downloading…" : "Download Excel"}
          </Button>
          <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={handleRefresh}>
            Refresh
          </Button>
          {canCreate && (
            <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              New Budgetary Quote
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full space-y-4">
        <ApiErrorAlert message={error} onRetry={handleRefresh} />
        <QuotationStatsStrip
          stats={stats}
          activeQueue={queue}
          role={user?.role}
          onSelectQueue={setQueue}
        />

        <DataTableCard>
          <DataTableToolbar>
            <DataTableTitle
              title="Quotation pipeline"
              subtitle={
                queue
                  ? `${data?.total ?? 0} in ${QUEUE_LABELS[queue]}`
                  : `${data?.total ?? 0} quotation${(data?.total ?? 0) === 1 ? "" : "s"}`
              }
            />
            <DataTableFilters>
              <DataTableSearch value={search} onChange={setSearch} placeholder="Search partner, end user, quote…" />
              {queue && (
                <button
                  type="button"
                  onClick={() => setQueue("")}
                  className="text-xs font-semibold text-[#C46A0A] hover:underline whitespace-nowrap"
                >
                  Clear queue filter
                </button>
              )}
              <TableFiltersPopover
                title="Filter quotations"
                fields={[
                  {
                    key: "phase",
                    label: "Phase",
                    values: phaseFilter,
                    options: PHASE_OPTIONS,
                    onChange: setPhaseFilter,
                  },
                  {
                    key: "status",
                    label: "Status",
                    values: statusFilter,
                    options: STATUS_OPTIONS,
                    onChange: setStatusFilter,
                  },
                ]}
              />
            </DataTableFilters>
          </DataTableToolbar>

          <DataTableWrap>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>Quote #</DataTableTh>
                  <DataTableTh>Phase</DataTableTh>
                  <DataTableTh>Partner</DataTableTh>
                  <DataTableTh>End User</DataTableTh>
                  <DataTableTh>SP</DataTableTh>
                  <DataTableTh>Value</DataTableTh>
                  <DataTableTh>Status</DataTableTh>
                  <DataTableTh>Your next step</DataTableTh>
                  <DataTableTh align="right">Actions</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {loading && <DataTableState colSpan={9}>Loading quotations…</DataTableState>}
                {!loading && !data?.items.length && (
                  <DataTableState colSpan={9}>
                    {hasActiveFilters ? (
                      <span className="inline-flex flex-col items-center gap-2">
                        <span>
                          {queue
                            ? `No quotations in ${QUEUE_LABELS[queue]}`
                            : "No quotations match your search / filters"}
                        </span>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-[#C46A0A] font-semibold hover:underline"
                        >
                          Clear search & filters
                        </button>
                      </span>
                    ) : (
                      "No quotations yet — create a budgetary quote to start"
                    )}
                  </DataTableState>
                )}
                {data?.items.map(q => {
                  const needsYou = (q.allowedActions?.length ?? 0) > 0;
                  const approval = isApprovalAction(q.allowedActions);
                  return (
                    <DataTableRow
                      key={q.id}
                      className={cn(
                        "cursor-pointer hover:bg-[#F8F9FC]",
                        needsYou && "bg-[#FFF8F0]/70",
                        approval && "bg-amber-50/70",
                      )}
                      onClick={() => setViewingId(q.id)}
                    >
                      <DataTableTd className="font-semibold text-[#0B1F3A]">{q.quoteNumber}</DataTableTd>
                      <DataTableTd className="capitalize">{q.phase}</DataTableTd>
                      <DataTableTd>{q.partner || "—"}</DataTableTd>
                      <DataTableTd>{q.endUser || "—"}</DataTableTd>
                      <DataTableTd>{q.salesPerson || "—"}</DataTableTd>
                      <DataTableTd>{q.dealValue || "—"}</DataTableTd>
                      <DataTableTd>
                        <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold border", statusTone(q.status))}>
                          {q.status}
                        </span>
                      </DataTableTd>
                      <DataTableTd>
                        {needsYou ? (
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold border",
                              approval
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-[#FFF4E8] text-[#C46A0A] border-[#F7931E]/30",
                            )}
                          >
                            {q.actionHint || "Action available"}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1] text-xs">—</span>
                        )}
                      </DataTableTd>
                      <DataTableTd>
                        <DataTableActions>
                          <DataTableIconButton
                            title="View details"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingId(q.id);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DataTableIconButton>
                          {needsYou && (
                            <DataTableIconButton
                              title="Open workflow / approve"
                              className="text-[#C46A0A] hover:text-[#0B1F3A]"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/quotations/${q.id}`);
                              }}
                            >
                              <Workflow className="w-3.5 h-3.5" />
                            </DataTableIconButton>
                          )}
                        </DataTableActions>
                      </DataTableTd>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </DataTableWrap>
        </DataTableCard>
      </div>

      <QuotationViewModal
        open={viewingId != null}
        quotationId={viewingId}
        onClose={() => setViewingId(null)}
        onOpenWorkflow={(id) => {
          setViewingId(null);
          navigate(`/admin/quotations/${id}`);
        }}
      />

      <CreateQuotationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async (id) => {
          setShowCreate(false);
          // Clear leftover search/filters so the new quote is not hidden.
          clearFilters();
          setViewingId(id);
          refreshStats();
          try {
            setData(await getQuotations({}));
          } catch {
            refresh();
          }
        }}
      />
    </>
  );
}
