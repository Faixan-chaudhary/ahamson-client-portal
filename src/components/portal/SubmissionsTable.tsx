import { useNavigate } from "react-router";
import { useState } from "react";
import { Download, Eye as ViewIcon, FileText } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { TableFiltersPopover } from "./TableFiltersPopover";
import { CopyButton } from "./CopyButton";
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
import { getClientLink, getSubmissionById } from "@/lib/storage";
import { downloadSubmissionPdf } from "@/lib/download-submission-pdf";
import { defaultDocumentForm } from "@/lib/document-form-defaults";
import { formatDateTime } from "@/lib/utils";
import type { Submission } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "opened", label: "Opened" },
  { value: "submitted", label: "Submitted" },
  { value: "expired", label: "Expired" },
];

interface SubmissionsTableProps {
  submissions: Submission[];
  loading?: boolean;
  search: string;
  statusFilter: string[];
  total?: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string[]) => void;
}

export function SubmissionsTable({
  submissions,
  loading = false,
  search,
  statusFilter = [],
  total,
  onSearchChange,
  onStatusChange,
}: SubmissionsTableProps) {
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const submission = await getSubmissionById(id);
      if (!submission?.formData) return;
      await downloadSubmissionPdf(
        submission.formData ?? defaultDocumentForm(),
        `AHamson-Client-Registration-${submission.id}.pdf`,
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DataTableCard>
      <DataTableToolbar>
        <DataTableTitle
          title="Document Submissions"
          subtitle={total !== undefined ? `${total} submission${total !== 1 ? "s" : ""}` : undefined}
          icon={<FileText className="w-4 h-4 text-[#0B1F3A]" />}
        />
        <DataTableFilters>
          <DataTableSearch value={search} onChange={onSearchChange} placeholder="Search submissions…" />
          <TableFiltersPopover
            title="Filter submissions"
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
              <DataTableTh>Client Company</DataTableTh>
              <DataTableTh>Contact Person</DataTableTh>
              <DataTableTh>Email</DataTableTh>
              <DataTableTh>Status</DataTableTh>
              <DataTableTh>Created At</DataTableTh>
              <DataTableTh>Expires At</DataTableTh>
              <DataTableTh>Submitted At</DataTableTh>
              <DataTableTh align="right">Actions</DataTableTh>
            </DataTableHeadRow>
          </DataTableHead>
          <DataTableBody>
            {loading ? (
              <DataTableState colSpan={8}>Loading submissions…</DataTableState>
            ) : submissions.length === 0 ? (
              <DataTableState colSpan={8}>No submissions found</DataTableState>
            ) : submissions.map(s => (
              <DataTableRow key={s.id}>
                <DataTableTd variant="primary" className="whitespace-nowrap max-w-[200px] truncate">
                  {s.clientCompany}
                </DataTableTd>
                <DataTableTd className="whitespace-nowrap">{s.contactPerson}</DataTableTd>
                <DataTableTd className="whitespace-nowrap">{s.email}</DataTableTd>
                <DataTableTd><StatusBadge status={s.status} /></DataTableTd>
                <DataTableTd variant="muted">{formatDateTime(s.createdAt)}</DataTableTd>
                <DataTableTd variant="muted">{formatDateTime(s.expiresAt)}</DataTableTd>
                <DataTableTd variant="muted">{s.submittedAt ? formatDateTime(s.submittedAt) : "—"}</DataTableTd>
                <DataTableTd>
                  <DataTableActions>
                    <DataTableIconButton title="View submission" onClick={() => navigate(`/admin/submissions/${s.id}`)}>
                      <ViewIcon className="w-4 h-4" />
                    </DataTableIconButton>
                    <CopyButton text={getClientLink(s.token)} variant="icon" title="Copy client link" />
                    <DataTableIconButton
                      title={s.status === "submitted" ? "Download PDF" : "Available after client submits"}
                      disabled={s.status !== "submitted" || downloadingId === s.id}
                      onClick={() => handleDownload(s.id)}
                    >
                      <Download className="w-4 h-4" />
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
