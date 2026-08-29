"use client";

import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ErrorState, TableSkeleton } from "@/components/states";
import { StatTile, StatTileRow } from "@/components/stat-tile";
import { ApiError } from "@/lib/api";
import { dashboard } from "@/lib/dashboard";
import { OnSiteBoard } from "./_components/OnSiteBoard";
import { useOnSite, useCheckOut, type OnSiteDto } from "./_hooks/useVisitors";

export default function SecurityDashboard() {
  const { data, isLoading, isError, refetch } = useOnSite();
  const checkOut = useCheckOut();
  const { data: stats } = dashboard.useSecurity();

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

      <StatTileRow>
        <StatTile label="On site now" value={stats?.onSiteNow ?? 0} />
        <StatTile
          label="Open alerts"
          value={stats?.openAlerts ?? 0}
          tone={stats && stats.openAlerts > 0 ? "denied" : "neutral"}
        />
        <StatTile
          label="Denied today"
          value={stats?.deniedToday ?? 0}
          tone={stats && stats.deniedToday > 0 ? "denied" : "neutral"}
          href="/security/access"
        />
        <StatTile
          label="Expiring within the hour"
          value={stats?.expiringWithinHour ?? 0}
          tone={stats && stats.expiringWithinHour > 0 ? "pending" : "neutral"}
          href="/security/passes"
        />
      </StatTileRow>

      {isLoading && <TableSkeleton rows={3} />}
      {isError && <ErrorState body="The on-site board could not be loaded." onRetry={() => void refetch()} />}
      {!isLoading && !isError && (
        <OnSiteBoard rows={data ?? []} onCheckOut={(row) => void onCheckOut(row)} isCheckingOut={checkOut.isPending} />
      )}
    </RequireRole>
  );
}
