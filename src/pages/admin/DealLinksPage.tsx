import { useState } from "react";
import { FilePlus } from "lucide-react";
import { PageHeader } from "@/components/portal/Logo";
import { CreateDealLinkModal } from "@/components/portal/CreateDealLinkModal";
import { DealLinksTable } from "@/components/portal/DealLinksTable";
import { Button } from "@/components/portal/Button";
import { ApiErrorAlert } from "@/components/portal/ApiErrorAlert";
import { getDealLinks } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function DealLinksPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search);
  const { data, loading, error, refresh } = useApiQuery(
    () => getDealLinks({ search: debouncedSearch, status: statusFilter }),
    [debouncedSearch, statusFilter],
  );

  return (
    <>
      <PageHeader
        title="Deal Registration Links"
        subtitle="Create and manage secure partner deal registration links"
      >
        <Button variant="gold" icon={<FilePlus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          <span className="sm:hidden">Create Link</span>
          <span className="hidden sm:inline">Create Deal Link</span>
        </Button>
      </PageHeader>

      <div className="p-3 sm:p-6 lg:p-8 w-full">
        <ApiErrorAlert message={error} onRetry={refresh} />
        <DealLinksTable
          links={data?.items ?? []}
          loading={loading}
          search={search}
          statusFilter={statusFilter}
          total={data?.total}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
        />
      </div>

      <CreateDealLinkModal open={showModal} onClose={() => setShowModal(false)} onCreated={refresh} />
    </>
  );
}
