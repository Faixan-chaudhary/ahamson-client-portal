import { useNavigate } from "react-router";
import { ClipboardPen, Eye as ViewIcon } from "lucide-react";
import { DealStatusBadge } from "./DealStatusBadge";
import { TableFiltersPopover } from "./TableFiltersPopover";
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
} from "./DataTable";
import { formatDateTime } from "@/lib/utils";
import type { DealRegistration } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "opened", label: "Opened" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

interface DealsTableProps {
  deals: DealRegistration[];
  loading?: boolean;
  search: string;
  statusFilter: string[];
  total?: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string[]) => void;
}

export function DealsTable({
  deals,
  loading = false,
  search,
  statusFilter = [],
  total,
  onSearchChange,
  onStatusChange,
}: DealsTableProps) {
  const navigate = useNavigate();

  return (
    <DataTableCard>
      <DataTableToolbar>
        <DataTableTitle
          title="Deal Registrations"
          subtitle={total !== undefined ? `${total} deal${total !== 1 ? "s" : ""}` : undefined}
          icon={<ClipboardPen className="w-4 h-4 text-[#0B1F3A]" />}
        />
        <DataTableFilters>
          <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search deals…" />
          <TableFiltersPopover
            title="Filter deals"
            fields={[
              {
                key: "status",
                label: "Status",
                values: statusFilter,
                options: STATUS_OPTIONS,
                onChange: onStatusChange,
              },
            ]}
          />
        </DataTableFilters>
      </DataTableToolbar>

      <DataTableWrap>
        <DataTable className="min-w-[980px]">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableTh>Deal ID</DataTableTh>
              <DataTableTh>Partner Company</DataTableTh>
              <DataTableTh>End Customer</DataTableTh>
              <DataTableTh>Contact</DataTableTh>
              <DataTableTh>Project</DataTableTh>
              <DataTableTh>Value (USD)</DataTableTh>
              <DataTableTh>Status</DataTableTh>
              <DataTableTh>Submitted</DataTableTh>
              <DataTableTh align="right">Actions</DataTableTh>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableState colSpan={9}>Loading deals…</DataTableState>
            ) : deals.length === 0 ? (
              <DataTableState colSpan={9}>No deal registrations yet</DataTableState>
            ) : deals.map(d => (
              <DataTableRow key={d.id}>
                <DataTableTd variant="primary" className="whitespace-nowrap font-['JetBrains_Mono'] text-xs">
                  {d.id}
                </DataTableTd>
                <DataTableTd className="whitespace-nowrap max-w-[180px] truncate">{d.partnerCompanyName}</DataTableTd>
                <DataTableTd className="whitespace-nowrap max-w-[160px] truncate">{d.endCustomerName}</DataTableTd>
                <DataTableTd className="whitespace-nowrap">{d.contactPerson}</DataTableTd>
                <DataTableTd className="whitespace-nowrap max-w-[160px] truncate">{d.projectName || "—"}</DataTableTd>
                <DataTableTd className="whitespace-nowrap">{d.estimatedValueUsd || "—"}</DataTableTd>
                <DataTableTd><DealStatusBadge status={d.status} /></DataTableTd>
                <DataTableTd variant="muted">
                  {d.submittedAt ? formatDateTime(d.submittedAt) : formatDateTime(d.createdAt)}
                </DataTableTd>
                <DataTableTd>
                  <DataTableActions>
                    <DataTableIconButton title="View deal" onClick={() => navigate(`/admin/deals/${d.id}`)}>
                      <ViewIcon className="w-4 h-4" />
                    </DataTableIconButton>
                  </DataTableActions>
                </DataTableTd>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </DataTableWrap>
    </DataTableCard>
  );
}
