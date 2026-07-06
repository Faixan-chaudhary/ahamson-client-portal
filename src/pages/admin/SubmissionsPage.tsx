import { useMemo } from "react";
import { AdminLayout } from "@/components/portal/AdminLayout";
import { PageHeader } from "@/components/portal/Logo";
import { SubmissionsTable } from "@/components/portal/SubmissionsTable";
import { getSubmissions } from "@/lib/storage";

export function SubmissionsPage() {
  const submissions = useMemo(() => getSubmissions(), []);

  return (
    <AdminLayout>
      <PageHeader title="Submissions" subtitle="View and manage all client document submissions" />
      <div className="p-6 lg:p-8 w-full">
        <SubmissionsTable submissions={submissions} />
      </div>
    </AdminLayout>
  );
}
