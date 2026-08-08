"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useRequestList, type RequestStatus } from "./_hooks/useRequests";

const FILTERS: { label: string; value?: RequestStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under verification", value: "UNDER_VERIFICATION" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function MyRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | undefined>();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useRequestList(status, page);

  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <PageHeader
        title="My requests"
        description="Raise a card request and follow its progress."
        actions={
          <Button render={<Link href="/employee/requests/new">New request</Link>} />
        }
      />

      <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={status === f.value}
            onClick={() => { setStatus(f.value); setPage(0); }}
            className={`rounded-card px-3 py-1.5 text-sm ${
              status === f.value
                ? "bg-credential/10 font-medium text-credential"
                : "text-slate hover:bg-paper"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {isError && (
        <ErrorState
          body="Your requests could not be loaded."
          onRetry={() => void refetch()}
        />
      )}

      {data && data.content.length === 0 && (
        <EmptyState
          title="No requests yet"
          body="Raise a request when you need a new ID card, or to replace a lost one."
          action={
            <Button render={<Link href="/employee/requests/new">New request</Link>} />
          }
        />
      )}

      {data && data.content.length > 0 && (
        <div className="overflow-hidden rounded-card border border-rule bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-rule bg-paper text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Request</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((row) => (
                <tr key={row.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/employee/requests/${row.id}`}
                      className="identifier text-credential underline-offset-4 hover:underline"
                    >
                      {row.requestNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate">
                    {row.requestType.toLowerCase()}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 identifier text-slate">
                    {row.submittedAt
                      ? new Date(row.submittedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-rule px-4 py-2 text-sm text-slate">
              <span>
                Page {data.page + 1} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </RequireRole>
  );
}
