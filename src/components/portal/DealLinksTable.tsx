import { ClipboardPen } from "lucide-react";
import { TableFiltersPopover } from "./TableFiltersPopover";
import { CopyButton } from "./CopyButton";
import { DealStatusBadge } from "./DealStatusBadge";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableFilters,
  DataTableHead,
  DataTableHeadRow,
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
import type { DealLink } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "opened", label: "Opened" },
  { value: "expired", label: "Expired" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

interface DealLinksTableProps {
  links: DealLink[];
  loading?: boolean;
  search: string;
  statusFilter: string;
  total?: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function DealLinksTable({
  links,
  loading = false,
  search,
  statusFilter,
  total,
  onSearchChange,
  onStatusChange,
}: DealLinksTableProps) {
  const count = total ?? links.length;

  return (
    <DataTableCard>
      <DataTableToolbar>
        <DataTableTitle
          title="Deal Registration Links"
          subtitle={loading ? "Loading…" : `${count} link${count !== 1 ? "s" : ""} created`}
          icon={<ClipboardPen className="w-4 h-4 text-[#F7931E]" />}
        />
        <DataTableFilters>
          <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search deal links…" />
          <TableFiltersPopover
            title="Filter deal links"
            fields={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                options: STATUS_OPTIONS,
                onChange: onStatusChange,
              },
            ]}
          />
        </DataTableFilters>
      </DataTableToolbar>

      <DataTableWrap>
        <DataTable className="min-w-[820px]">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableTh>Deal ID</DataTableTh>
              <DataTableTh>Partner</DataTableTh>
              <DataTableTh>Contact</DataTableTh>
              <DataTableTh>Secure Link</DataTableTh>
              <DataTableTh>Status</DataTableTh>
              <DataTableTh>Expires</DataTableTh>
              <DataTableTh align="right">Actions</DataTableTh>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableState colSpan={7}>Loading deal links…</DataTableState>
            ) : links.length === 0 ? (
              <DataTableState colSpan={7}>No deal links yet. Create a shareable link for a partner.</DataTableState>
            ) : links.map(link => (
              <DataTableRow key={link.id}>
                <DataTableTd variant="primary" className="whitespace-nowrap font-['JetBrains_Mono'] text-xs">
                  {link.id}
                </DataTableTd>
                <DataTableTd className="whitespace-nowrap max-w-[160px] truncate">{link.partnerCompanyName}</DataTableTd>
                <DataTableTd className="whitespace-nowrap">{link.contactPerson}</DataTableTd>
                <DataTableTd>
                  <span className="truncate text-[#64748B] font-['JetBrains_Mono'] text-[11px] max-w-[240px] block">
                    {link.clientUrl}
                  </span>
                </DataTableTd>
                <DataTableTd>
                  <DealStatusBadge status={link.status as "pending"} />
                </DataTableTd>
                <DataTableTd variant="muted">{link.expiresAt ? formatDateTime(link.expiresAt) : "—"}</DataTableTd>
                <DataTableTd className="text-right">
                  <CopyButton text={link.clientUrl} />
                </DataTableTd>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </DataTableWrap>
    </DataTableCard>
  );
}
