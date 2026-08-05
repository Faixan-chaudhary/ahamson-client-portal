import { useMemo, useState } from "react";
import { Download, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { TableFiltersPopover } from "@/components/portal/TableFiltersPopover";
import { PipelineEntryModal } from "@/components/portal/PipelineEntryModal";
import { ConfirmDialog } from "@/components/portal/ConfirmDialog";
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
  addPipelineEntry,
  exportPipelineSheet,
  getPipeline,
  removePipelineEntry,
  savePipelineEntry,
} from "@/lib/storage";
import type { PipelineEntry, PipelineEntryInput } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDisplayDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

function formatMoney(value: string) {
  if (!value) return "—";
  const num = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num)) return value;
  return `AED ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function buildOptions(values: (string | undefined)[], allLabel: string) {
  const set = new Set(values.filter((v): v is string => Boolean(v)));
  return [
    { value: "all", label: allLabel },
    ...Array.from(set).sort().map(v => ({ value: v, label: v })),
  ];
}

export function PipelinePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [spFilter, setSpFilter] = useState("all");
  const [closureFilter, setClosureFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search);

  const filters = {
    search: debouncedSearch,
    status: statusFilter,
    brand: brandFilter,
    country: countryFilter,
    sp: spFilter,
    closure: closureFilter,
  };

  const { data, setData, loading, error, refresh } = useApiQuery(
    () => getPipeline(filters),
    [debouncedSearch, statusFilter, brandFilter, countryFilter, spFilter, closureFilter],
  );
  // Unfiltered list so dropdown options never shrink when a filter is applied
  const { data: allData, setData: setAllData } = useApiQuery(() => getPipeline(), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineEntry | null>(null);
  const [deleting, setDeleting] = useState<PipelineEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState("");

  const items = data?.items ?? [];
  const allItems = allData?.items ?? items;
  const statusOptions = useMemo(() => buildOptions(allItems.map(i => i.status), "All Status"), [allItems]);
  const brandOptions = useMemo(() => buildOptions(allItems.map(i => i.brand), "All Brands"), [allItems]);
  const countryOptions = useMemo(() => buildOptions(allItems.map(i => i.country), "All Countries"), [allItems]);
  const spOptions = useMemo(() => buildOptions(allItems.map(i => i.sp), "All SP"), [allItems]);
  const closureOptions = useMemo(() => buildOptions(allItems.map(i => i.closure), "All Closure"), [allItems]);

  type PipelineList = { items: PipelineEntry[]; total: number };

  function replaceEntry(list: PipelineList | null, saved: PipelineEntry): PipelineList | null {
    if (!list) return list;
    return { ...list, items: list.items.map(i => (i.id === saved.id ? saved : i)) };
  }

  function removeEntry(list: PipelineList | null, id: number): PipelineList | null {
    if (!list) return list;
    const items = list.items.filter(i => i.id !== id);
    return { items, total: list.total - (list.items.length - items.length) };
  }

  async function handleSave(input: PipelineEntryInput) {
    setActionError("");
    if (editing) {
      // Patch just the edited row in place — no full table refetch/rerender
      const saved = await savePipelineEntry(editing.id, input);
      setData(prev => replaceEntry(prev, saved));
      setAllData(prev => replaceEntry(prev, saved));
    } else {
      await addPipelineEntry(input);
      refresh();
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setActionError("");
    try {
      const id = deleting.id;
      await removePipelineEntry(id);
      setDeleting(null);
      // Drop just the deleted row locally — no full table refetch/rerender
      setData(prev => removeEntry(prev, id));
      setAllData(prev => removeEntry(prev, id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleExport() {
    setExporting(true);
    setActionError("");
    try {
      // Exports exactly what the table shows — filtered data when filters are active
      await exportPipelineSheet(filters);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to download Excel");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <PageHeader
          title="Sales Pipeline"
          subtitle="AHamson pipeline tracker — view online and download as Excel template"
        >
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              icon={exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Preparing…" : "Download Excel"}
            </Button>
            <Button
              variant="gold"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => { setEditing(null); setModalOpen(true); }}
            >
              Add Entry
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 lg:p-5 w-full gap-3 overflow-hidden">
        <div className="flex-shrink-0">
          <ApiErrorAlert message={error || actionError || null} onRetry={refresh} />
        </div>

        <DataTableCard className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <DataTableToolbar className="flex-shrink-0">
            <DataTableTitle
              title="Pipeline Sheet"
              subtitle={`${data?.total ?? 0} entr${(data?.total ?? 0) === 1 ? "y" : "ies"}`}
            />
            <DataTableFilters>
              <DataTableSearch value={search} onChange={setSearch} placeholder="Search pipeline…" />
              <TableFiltersPopover
                title="Filter pipeline"
                fields={[
                  { key: "brand", label: "Brand", value: brandFilter, options: brandOptions, onChange: setBrandFilter },
                  { key: "status", label: "Status", value: statusFilter, options: statusOptions, onChange: setStatusFilter },
                  { key: "country", label: "Country", value: countryFilter, options: countryOptions, onChange: setCountryFilter },
                  { key: "sp", label: "SP", value: spFilter, options: spOptions, onChange: setSpFilter },
                  { key: "closure", label: "Closure", value: closureFilter, options: closureOptions, onChange: setClosureFilter },
                ]}
              />
            </DataTableFilters>
          </DataTableToolbar>

          <DataTableWrap className="flex-1 min-h-0 scrollbar-thin">
            <DataTable className="min-w-[1280px]">
              <DataTableHead>
                <DataTableHeadRow>
                  <DataTableTh>Quote Date</DataTableTh>
                  <DataTableTh>SP</DataTableTh>
                  <DataTableTh>Partner</DataTableTh>
                  <DataTableTh>End User</DataTableTh>
                  <DataTableTh>Country</DataTableTh>
                  <DataTableTh>Brand</DataTableTh>
                  <DataTableTh>Product</DataTableTh>
                  <DataTableTh>Value (AED)</DataTableTh>
                  <DataTableTh>GP (AED)</DataTableTh>
                  <DataTableTh>Contact</DataTableTh>
                  <DataTableTh>Closure</DataTableTh>
                  <DataTableTh>Prob.</DataTableTh>
                  <DataTableTh>Status</DataTableTh>
                  <DataTableTh>Details</DataTableTh>
                  <DataTableTh align="right">Actions</DataTableTh>
                </DataTableHeadRow>
              </DataTableHead>
              <DataTableBody>
                {loading && items.length === 0 ? (
                  <DataTableState colSpan={15}>Loading pipeline…</DataTableState>
                ) : items.length === 0 ? (
                  <DataTableState colSpan={15}>No pipeline entries yet</DataTableState>
                ) : items.map(row => (
                  <DataTableRow key={row.id}>
                    <DataTableTd variant="muted">{formatDisplayDate(row.quoteDate)}</DataTableTd>
                    <DataTableTd>{row.sp || "—"}</DataTableTd>
                    <DataTableTd variant="primary" className="max-w-[140px] truncate">{row.partner || "—"}</DataTableTd>
                    <DataTableTd className="max-w-[160px] truncate">{row.endUser || "—"}</DataTableTd>
                    <DataTableTd>{row.country || "—"}</DataTableTd>
                    <DataTableTd>{row.brand || "—"}</DataTableTd>
                    <DataTableTd className="max-w-[220px]">
                      <span className="line-clamp-2 text-xs leading-snug">{row.product || "—"}</span>
                    </DataTableTd>
                    <DataTableTd variant="muted" className="whitespace-nowrap">{formatMoney(row.valueAed)}</DataTableTd>
                    <DataTableTd variant="muted" className="whitespace-nowrap">{formatMoney(row.gpAed)}</DataTableTd>
                    <DataTableTd>{row.contactName || "—"}</DataTableTd>
                    <DataTableTd>{row.closure || "—"}</DataTableTd>
                    <DataTableTd>{row.probability || "—"}</DataTableTd>
                    <DataTableTd>
                      {row.status ? (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em] border whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                          row.status.toLowerCase() === "quoted" && "bg-sky-50 text-sky-700 border-sky-200",
                          row.status.toLowerCase() === "expensive" && "bg-amber-50 text-amber-700 border-amber-200",
                          row.status.toLowerCase() === "won" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          row.status.toLowerCase() === "lost" && "bg-red-50 text-red-700 border-red-200",
                          row.status.toLowerCase() === "on hold" && "bg-violet-50 text-violet-700 border-violet-200",
                          !["quoted", "expensive", "won", "lost", "on hold"].includes(row.status.toLowerCase()) && "bg-[#F4F6FA] text-[#64748B] border-[#0B1F3A]/10",
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0 ring-2 ring-white/60",
                            row.status.toLowerCase() === "quoted" && "bg-sky-500",
                            row.status.toLowerCase() === "expensive" && "bg-amber-400",
                            row.status.toLowerCase() === "won" && "bg-emerald-500",
                            row.status.toLowerCase() === "lost" && "bg-red-500",
                            row.status.toLowerCase() === "on hold" && "bg-violet-500",
                            !["quoted", "expensive", "won", "lost", "on hold"].includes(row.status.toLowerCase()) && "bg-[#94A3B8]",
                          )} />
                          {row.status}
                        </span>
                      ) : (
                        <span className="text-[#CBD5E1]">—</span>
                      )}
                    </DataTableTd>
                    <DataTableTd className="max-w-[160px]">
                      <span className="line-clamp-2 text-xs">{row.details || "—"}</span>
                    </DataTableTd>
                    <DataTableTd>
                      <DataTableActions>
                        <DataTableIconButton
                          title="Edit"
                          onClick={() => { setEditing(row); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </DataTableIconButton>
                        <DataTableIconButton title="Delete" onClick={() => setDeleting(row)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </DataTableIconButton>
                      </DataTableActions>
                    </DataTableTd>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableWrap>
        </DataTableCard>
      </div>

      <PipelineEntryModal
        open={modalOpen}
        entry={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete pipeline entry"
        message={`Remove "${deleting?.partner || "this entry"}" from the pipeline?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
