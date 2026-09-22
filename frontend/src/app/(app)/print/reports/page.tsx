"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, TableSkeleton } from "@/components/states";
import { cn } from "@/lib/utils";
import { useReprintRate, useThroughput } from "../_hooks/usePrint";
import {
  BarChart3,
  Printer,
  Truck,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Building2,
  TrendingDown,
  Sparkles,
  Calendar,
} from "lucide-react";

export default function ProductionReportsPage() {
  const reprintRate = useReprintRate();
  const throughput = useThroughput();

  const deptData = reprintRate.data ?? [];
  const dailyData = throughput.data ?? [];

  // Summary KPI calculations
  const totalProduced = dailyData.reduce((acc, d) => acc + d.cardsPrinted, 0);
  const totalPassed = dailyData.reduce((acc, d) => acc + d.passed, 0);
  const totalFailed = dailyData.reduce((acc, d) => acc + d.failed, 0);
  const overallYieldPct = totalProduced > 0 ? Math.round((totalPassed / totalProduced) * 100) : 100;
  
  const avgWaitHours =
    dailyData.length > 0
      ? (dailyData.reduce((acc, d) => acc + d.avgHoursInQueue, 0) / dailyData.length).toFixed(1)
      : "0.0";

  return (
    <RequireRole allow={["PRINT_SUPERVISOR", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
        {/* Top Header & Contextual Navigation Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                Production & Quality Wastage Analytics
              </h1>
              <span className="badge-topic text-[10px]">
                Quality Assurance
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Identify printer hardware calibration drift, thermal head wear, and photo standard defects before they impact queue SLAs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/print"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print Queue</span>
            </Link>
            <Link
              href="/print/dispatch"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              <span>Dispatch Hub</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-credential px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Production Reports</span>
            </span>
          </div>
        </div>

        {/* ─── 1. EXECUTIVE QUALITY KPIS ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Overall Quality Yield
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{overallYieldPct}%</span>
              <span className="text-xs font-medium text-emerald-600">pass rate</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">First-time QC compliance</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Cards Produced
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-credential shadow-2xs">
                <Layers className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-ink">{totalProduced}</span>
              <span className="text-xs font-medium text-slate-400">printed</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-700">{totalPassed} successfully passed QC</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                QC Defects & Rejections
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs">
                <XCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{totalFailed}</span>
              <span className="text-xs font-medium text-slate-400">wasted</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-700">Lamination / RFID defects</div>
          </div>

          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Avg. Dwell Wait Time
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-2xs">
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">{avgWaitHours}h</span>
              <span className="text-xs font-medium text-slate-400">in queue</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">From approval to print burn</div>
          </div>
        </div>

        {/* ─── 2. DEPARTMENT REPRINT & DEFECT RATE BREAKDOWN ─── */}
        <Card className="rounded-2xl border-rule bg-surface shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-rule/60 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-credential" />
                <span>Reprint & Wastage Rate by Department</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of reprint orders compared to initial card issuances per organizational unit.
              </p>
            </div>
            <a
              href="/api/v1/print/reports/reprint-rate/export"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </a>
          </CardHeader>
          <CardContent className="p-5">
            {reprintRate.isLoading && <TableSkeleton rows={4} />}
            {reprintRate.isError && (
              <ErrorState body="This reprint report could not be loaded." onRetry={() => void reprintRate.refetch()} />
            )}
            {deptData.length === 0 && !reprintRate.isLoading && (
              <p className="text-xs text-slate-400 text-center py-6">No print jobs recorded in the system yet.</p>
            )}
            {deptData.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {deptData.map((row) => {
                  const rate = row.reprintRatePct;
                  const isHigh = rate > 15;
                  const isModerate = rate > 5 && rate <= 15;

                  return (
                    <div
                      key={row.deptName}
                      className={cn(
                        "rounded-xl border p-4 transition-all bg-paper/60 space-y-2.5",
                        isHigh ? "border-rose-300/80 bg-rose-50/30" : "border-rule/80"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-xs sm:text-sm text-ink">{row.deptName}</span>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-black",
                            isHigh
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : isModerate
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          )}
                        >
                          {rate}% Defect Rate
                        </span>
                      </div>

                      {/* Visual progress meter */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isHigh ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, rate))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span>
                          {row.reprintJobs} reprints of {row.totalJobs} total
                        </span>
                        {row.qcFailures > 0 ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {row.qcFailures} QC rejection{row.qcFailures === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">0 QC rejections</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 3. DAILY THROUGHPUT & PRODUCTION YIELD TABLE ─── */}
        <Card className="rounded-2xl border-rule bg-surface shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-rule/60 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-credential" />
                <span>Daily Throughput & Production Yield Log</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Day-by-day record of card output, quality inspection pass/fail distribution, and queue dwell times.
              </p>
            </div>
            <a
              href="/api/v1/print/reports/throughput/export"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </a>
          </CardHeader>
          <CardContent className="p-0">
            {throughput.isLoading && <TableSkeleton rows={5} />}
            {throughput.isError && (
              <ErrorState body="This throughput report could not be loaded." onRetry={() => void throughput.refetch()} />
            )}
            {dailyData.length === 0 && !throughput.isLoading && (
              <p className="text-xs text-slate-400 text-center py-8">No daily production logs recorded yet.</p>
            )}
            {dailyData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-rule bg-paper font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Production Date</th>
                      <th className="px-4 py-3 text-right">Cards Printed</th>
                      <th className="px-4 py-3 text-right">Passed QC</th>
                      <th className="px-4 py-3 text-right">Failed QC</th>
                      <th className="px-4 py-3 text-right">Yield %</th>
                      <th className="px-4 py-3 text-right">Avg. Queue Wait</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/60">
                    {dailyData.map((row) => {
                      const yieldRate =
                        row.cardsPrinted > 0 ? Math.round((row.passed / row.cardsPrinted) * 100) : 100;
                      return (
                        <tr key={row.printDate} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-ink flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{row.printDate}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-ink">
                            {row.cardsPrinted}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            {row.passed}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-rose-700">
                            {row.failed}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            <span
                              className={cn(
                                "inline-block rounded-md px-2 py-0.5 text-xs",
                                yieldRate >= 95
                                  ? "bg-emerald-50 text-emerald-700"
                                  : yieldRate >= 80
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                              )}
                            >
                              {yieldRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {row.avgHoursInQueue.toFixed(1)} hrs
                          </td>
                        </tr>
                      );
                    })}
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

