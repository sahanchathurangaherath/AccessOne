"use client";

import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, TableSkeleton } from "@/components/states";
import { useReprintRate, useThroughput } from "../_hooks/usePrint";

export default function ProductionReportsPage() {
  const reprintRate = useReprintRate();
  const throughput = useThroughput();

  return (
    <RequireRole allow={["PRINT_SUPERVISOR"]}>
      <PageHeader
        title="Production reports"
        description="A rising reprint rate points at a printer fault or a photo-quality standard that is too loose -- neither is visible from any single card."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reprint rate by department</CardTitle>
            <a
              href="/api/v1/print/reports/reprint-rate/export"
              className="text-sm text-credential underline-offset-4 hover:underline"
            >
              Export CSV
            </a>
          </CardHeader>
          <CardContent>
            {reprintRate.isLoading && <TableSkeleton rows={4} />}
            {reprintRate.isError && (
              <ErrorState body="This report could not be loaded." onRetry={() => void reprintRate.refetch()} />
            )}
            {reprintRate.data && reprintRate.data.length === 0 && (
              <p className="text-sm text-slate">No print jobs recorded yet.</p>
            )}
            {reprintRate.data && reprintRate.data.length > 0 && (
              <div className="space-y-3">
                {reprintRate.data.map((row) => (
                  <div key={row.deptName} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{row.deptName}</span>
                      <span className="identifier text-slate">
                        {row.reprintRatePct}% · {row.reprintJobs} of {row.totalJobs} jobs
                        {row.qcFailures > 0 && ` · ${row.qcFailures} QC failure${row.qcFailures === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-card bg-paper">
                      <div
                        className="h-full rounded-card bg-pending"
                        style={{ width: `${Math.min(100, row.reprintRatePct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daily throughput</CardTitle>
            <a
              href="/api/v1/print/reports/throughput/export"
              className="text-sm text-credential underline-offset-4 hover:underline"
            >
              Export CSV
            </a>
          </CardHeader>
          <CardContent>
            {throughput.isLoading && <TableSkeleton rows={5} />}
            {throughput.isError && (
              <ErrorState body="This report could not be loaded." onRetry={() => void throughput.refetch()} />
            )}
            {throughput.data && throughput.data.length === 0 && (
              <p className="text-sm text-slate">No cards have been printed yet.</p>
            )}
            {throughput.data && throughput.data.length > 0 && (
              <div className="overflow-hidden rounded-card border border-rule">
                <table className="w-full text-sm">
                  <thead className="border-b border-rule bg-paper text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 text-right font-medium">Printed</th>
                      <th className="px-4 py-2 text-right font-medium">Passed</th>
                      <th className="px-4 py-2 text-right font-medium">Failed</th>
                      <th className="px-4 py-2 text-right font-medium">Avg. hours in queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {throughput.data.map((row) => (
                      <tr key={row.printDate} className="border-b border-rule last:border-0">
                        <td className="px-4 py-2 identifier">{row.printDate}</td>
                        <td className="px-4 py-2 text-right">{row.cardsPrinted}</td>
                        <td className="px-4 py-2 text-right">{row.passed}</td>
                        <td className="px-4 py-2 text-right">{row.failed}</td>
                        <td className="px-4 py-2 text-right identifier">{row.avgHoursInQueue.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
