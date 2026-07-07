import { PageHeader } from "@/components/portal/Logo";
import { SubmissionsTable } from "@/components/portal/SubmissionsTable";
import { getSubmissions } from "@/lib/storage";
import { useApiQuery } from "@/hooks/useApiQuery";

export function SubmissionsPage() {
  const { data: submissions, loading } = useApiQuery(() => getSubmissions(), []);

  return (
    <>
      <PageHeader title="Submissions" subtitle="View and manage all client document submissions" />
      <div className="p-6 lg:p-8 w-full">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#0B1F3A]/8 p-12 text-center text-[#94A3B8] text-sm">Loading submissions…</div>
        ) : (
          <SubmissionsTable submissions={submissions ?? []} />
        )}
      </div>
    </>
  );
}
