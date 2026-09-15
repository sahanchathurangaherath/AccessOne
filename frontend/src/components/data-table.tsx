"use client";

import Link from "next/link";
import type { PageResponse } from "@/lib/paged";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  page?: PageResponse<T>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  rowHref?: (row: T) => string;
  empty: { title: string; body: string; action?: React.ReactNode };
  onPageChange?: (page: number) => void;
  className?: string;
};

/**
 * Enterprise Data Table with loading skeleton, empty and error states,
 * smooth row hovering, and polished pagination.
 */
export function DataTable<T extends { id: number | string }>({
  columns,
  page,
  isLoading,
  isError,
  onRetry,
  rowHref,
  empty,
  onPageChange,
  className,
}: Props<T>) {
  if (isLoading && !page?.content?.length) {
    return <TableSkeleton rows={5} />;
  }

  if (isError && !page?.content?.length) {
    return <ErrorState body="This list could not be loaded." onRetry={onRetry} />;
  }

  if (!page || page.content.length === 0) {
    return <EmptyState title={empty.title} body={empty.body} action={empty.action} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="table-shell overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead className="border-b border-rule bg-slate-50/80 text-left">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn(
                      "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {page.content.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/80 group"
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-5 py-3.5 text-ink",
                        c.align === "right" && "text-right tabular-nums",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {i === 0 && rowHref ? (
                        <Link
                          href={rowHref(row)}
                          className="font-medium text-credential underline-offset-4 hover:underline focus-visible:outline-none"
                        >
                          {c.render(row)}
                        </Link>
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page.totalPages > 1 && onPageChange && (
          <Pagination page={page} onChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

function Pagination<T>({
  page,
  onChange,
}: {
  page: PageResponse<T>;
  onChange: (page: number) => void;
}) {
  const startItem = page.page * page.size + 1;
  const endItem = Math.min((page.page + 1) * page.size, page.totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-rule bg-surface px-5 py-3 text-xs text-slate">
      <div className="flex items-center gap-1">
        <span>
          Showing <span className="font-semibold text-ink">{startItem}</span> to{" "}
          <span className="font-semibold text-ink">{endItem}</span> of{" "}
          <span className="font-semibold text-ink">{page.totalElements}</span> results
        </span>
        <span className="text-slate-400 mx-1">•</span>
        <span>
          Page <span className="font-semibold text-ink">{page.page + 1}</span> of{" "}
          <span className="font-semibold text-ink">{page.totalPages}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page.first}
          onClick={() => onChange(Math.max(0, page.page - 1))}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page.last}
          onClick={() => onChange(page.page + 1)}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
