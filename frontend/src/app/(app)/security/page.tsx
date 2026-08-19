"use client";

import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, TableSkeleton } from "@/components/states";
import { ApiError } from "@/lib/api";
import { OnSiteBoard } from "./_components/OnSiteBoard";
import { useOnSite, useCheckOut, type OnSiteDto } from "./_hooks/useVisitors";

export default function SecurityDashboard() {
  const { data, isLoading, isError, refetch } = useOnSite();
  const checkOut = useCheckOut();

  async function onCheckOut(row: OnSiteDto) {
    try {
      await checkOut.mutateAsync(row.passId);
      toast.success(`${row.visitorName} checked out`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.problem.detail : "Could not check out this visitor");
    }
  }

  return (
    <RequireRole allow={["SECURITY_OFFICER"]}>
      <PageHeader
        title="On site now"
        description="Every visitor currently checked in, derived from open visit logs -- never a stored flag."
      />

      {isLoading && <TableSkeleton rows={3} />}
      {isError && <ErrorState body="The on-site board could not be loaded." onRetry={() => void refetch()} />}
      {!isLoading && !isError && (
        <OnSiteBoard rows={data ?? []} onCheckOut={(row) => void onCheckOut(row)} isCheckingOut={checkOut.isPending} />
      )}
    </RequireRole>
  );
}
