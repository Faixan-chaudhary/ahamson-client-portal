import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { ConfirmDialog } from "@/components/portal/ConfirmDialog";
import { SalesActivityModal } from "@/components/portal/SalesActivityModal";
import { SalesActivityViewModal } from "@/components/portal/SalesActivityViewModal";
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
import {
  exportSalesActivitiesSheet,
  getSalesActivities,
  removeSalesActivity,
} from "@/lib/storage";
import type { SalesActivity } from "@/lib/types";
import { can } from "@/lib/permissions";

function formatDisplayDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

export function SalesActivitiesPage() {
  const canMutate = can.mutateSalesActivity();
  const [search, setSearch] = useState("");
  const [spFilter, setSpFilter] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SalesActivity | null>(null);
  const [viewing, setViewing] = useState<SalesActivity | null>(null);
  const [deleting, setDeleting] = useState<SalesActivity | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const filters = { search: debouncedSearch, salesPerson: toFilterParam(spFilter) };
  const { data, setData, loading, error, refresh } = useApiQuery(
    () => getSalesActivities(filters),
    [debouncedSearch, spFilter],
  );
  const { data: allData } = useApiQuery(() => getSalesActivities(), []);

  const spOptions = useMemo(() => {
    const set = new Set((allData?.items ?? data?.items ?? []).map(i => i.salesPerson).filter(Boolean));
    return Array.from(set).sort();
  }, [allData, data]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportSalesActivitiesSheet(filters);
    } finally {
      setExporting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    await removeSalesActivity(deleting.id);
    setData(prev => {
      if (!prev) return prev;
      return {
        items: prev.items.filter(i => i.id !== deleting.id),
        total: Math.max(0, prev.total - 1),
      };
    });
    setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="Sales Activities"
        subtitle="Meeting log — download uses Sales Activities template.xlsx"
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
          <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={refresh}>
            Refresh
          </Button>
          {canMutate && (
            <Button
              variant="gold"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => { setEditing(null); setShowModal(true); }}
            >
              Add Activity
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full space-y-4">
        <ApiErrorAlert message={error} onRetry={refresh} />

        <DataTableCard>
          <DataTableToolbar>
            <DataTableTitle title="Sales Activities" total={data?.total} />
            <DataTableFilters>
              <DataTableSearch value={search} onChange={setSearch} placeholder="Search customer, contact…" />
              <TableFiltersPopover
                title="Filter activities"
                fields={[
                  {
                    key: "sp",
                    label: "Sales Person",
                    values: spFilter,
                    options: spOptions,
                    onChange: setSpFilter,
                  },
                ]}
              />
            </DataTableFilters>
          </DataTableToolbar>

          <DataTableWrap>
            <DataTable>
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>Sales Person</DataTableTh>
                  <DataTableTh>Customer Name</DataTableTh>
                  <DataTableTh>Meeting Date</DataTableTh>
                  <DataTableTh>Contact Person</DataTableTh>
                  <DataTableTh>Contact Number</DataTableTh>
                  <DataTableTh>Meeting outputs</DataTableTh>
                  <DataTableTh align="right" className="w-[120px]">Actions</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {loading && <DataTableState colSpan={7}>Loading activities…</DataTableState>}
                {!loading && !data?.items.length && (
                  <DataTableState colSpan={7}>No sales activities yet</DataTableState>
                )}
                {data?.items.map(item => (
                  <DataTableRow key={item.id}>
                    <DataTableTd>{item.salesPerson || "—"}</DataTableTd>
                    <DataTableTd>
                      <button
                        type="button"
                        className="font-semibold text-[#0B1F3A] hover:text-[#C46A0A] hover:underline text-left"
                        onClick={() => setViewing(item)}
                        title="View details & activity log"
                      >
                        {item.customerName || "—"}
                      </button>
                    </DataTableTd>
                    <DataTableTd>{formatDisplayDate(item.meetingDate)}</DataTableTd>
                    <DataTableTd>{item.contactPerson || "—"}</DataTableTd>
                    <DataTableTd>{item.contactNumber || "—"}</DataTableTd>
                    <DataTableTd className="max-w-[200px] truncate" title={item.meetingOutputs}>
                      {item.meetingOutputs || "—"}
                    </DataTableTd>
                    <DataTableTd className="whitespace-nowrap">
                      <DataTableActions className="opacity-100 min-w-[108px]">
                        <DataTableIconButton
                          title="View details & logs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewing(item);
                          }}
                          className="text-[#C46A0A] hover:text-[#0B1F3A]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DataTableIconButton>
                        {canMutate && (
                          <>
                            <DataTableIconButton
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(item);
                                setShowModal(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </DataTableIconButton>
                            <DataTableIconButton
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleting(item);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </DataTableIconButton>
                          </>
                        )}
                      </DataTableActions>
                    </DataTableTd>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableWrap>
        </DataTableCard>
      </div>

      <SalesActivityViewModal
        open={!!viewing}
        activity={viewing}
        onClose={() => setViewing(null)}
        onEdit={canMutate ? (item) => {
          setViewing(null);
          setEditing(item);
          setShowModal(true);
        } : undefined}
      />

      {canMutate && (
        <SalesActivityModal
          open={showModal}
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete sales activity"
        message={`Remove meeting with "${deleting?.customerName || "this customer"}"?`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
