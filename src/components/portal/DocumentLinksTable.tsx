import { Link2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { TableFiltersPopover } from "./TableFiltersPopover";
import { CopyButton } from "./CopyButton";
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
import type { DocumentLink } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "opened", label: "Opened" },
  { value: "submitted", label: "Submitted" },
  { value: "expired", label: "Expired" },
];

interface DocumentLinksTableProps {
  links: DocumentLink[];
  loading?: boolean;
  search: string;
  statusFilter: string[];
  total?: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string[]) => void;
}

export function DocumentLinksTable({
  links,
  loading = false,
  search,
  statusFilter = [],
  total,
  onSearchChange,
  onStatusChange,
}: DocumentLinksTableProps) {
  const count = total ?? links.length;

  return (
    <DataTableCard>
      <DataTableToolbar>
        <DataTableTitle
          title="Active Document Links"
          subtitle={loading ? "Loading…" : `${count} link${count !== 1 ? "s" : ""} created`}
          icon={<Link2 className="w-4 h-4 text-[#F7931E]" />}
        />
        <DataTableFilters>
          <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search links…" />
          <TableFiltersPopover
            title="Filter links"
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
        <DataTable className="min-w-[820px]">
          <DataTableHead>
            <DataTableHeadRow>
              <DataTableTh>Client Company</DataTableTh>
              <DataTableTh>Contact</DataTableTh>
              <DataTableTh>Secure Link</DataTableTh>
              <DataTableTh>Status</DataTableTh>
              <DataTableTh>Expires</DataTableTh>
              <DataTableTh align="right">Actions</DataTableTh>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableState colSpan={6}>Loading links…</DataTableState>
            ) : links.length === 0 ? (
              <DataTableState colSpan={6}>No links found. Create your first secure document link.</DataTableState>
            ) : links.map(link => (
              <DataTableRow key={link.id}>
                <DataTableTd variant="primary" className="whitespace-nowrap">
                  {link.clientCompany}
                </DataTableTd>
                <DataTableTd className="whitespace-nowrap">{link.contactPerson}</DataTableTd>
                <DataTableTd>
                  <div className="flex items-center gap-1.5 text-xs max-w-[260px]">
                    <span className="w-6 h-6 rounded-md bg-[#F7931E]/10 border border-[#F7931E]/15 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-3 h-3 text-[#F7931E]" />
                    </span>
                    <span className="truncate text-[#64748B] font-['JetBrains_Mono'] text-[11px]">{link.clientUrl}</span>
                  </div>
                </DataTableTd>
                <DataTableTd><StatusBadge status={link.status} /></DataTableTd>
                <DataTableTd variant="muted">{formatDateTime(link.expiresAt)}</DataTableTd>
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
