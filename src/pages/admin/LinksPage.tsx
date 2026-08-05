import { useState } from "react";
import { FilePlus } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { CreateLinkModal } from "@/components/portal/CreateLinkModal";
import { DocumentLinksTable } from "@/components/portal/DocumentLinksTable";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { getDocumentLinks } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function LinksPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search);
  const { data, loading, error, refresh } = useApiQuery(
    () => getDocumentLinks({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter],
  );

  return (
    <>
      <PageHeader title="Document Links" subtitle="Create and manage secure client document links">
        <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          <span className="sm:hidden">Create Link</span>
          <span className="hidden sm:inline">Create Document Link</span>
        </Button>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full">
        <ApiErrorAlert message={error} onRetry={refresh} />
        <DocumentLinksTable
          links={data?.items ?? []}
          loading={loading}
          search={search}
          statusFilter={statusFilter}
          total={data?.total}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
      </div>

      <CreateLinkModal open={showModal} onClose={() => setShowModal(false)} onCreated={refresh} />
    </>
  );
}
