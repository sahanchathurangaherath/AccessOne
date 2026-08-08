"use client";

import Link from "next/link";
import type { PageResponse } from "@/lib/paged";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  width?: string;
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
};

/**
 * The shape every list screen in the system needs: loading, empty, error,
 * a table, and pagination. A module supplies columns and a row-to-url
 * function; everything else is here once.
 */
export function DataTable<T extends { id: number }>({
  columns, page, isLoading, isError, onRetry, rowHref, empty, onPageChange,
}: Props<T>) {

  if (isLoading) return <TableSkeleton rows={5} />;

  if (isError) {
    return <ErrorState body="This list could not be loaded." onRetry={onRetry} />;
  }

  if (!page || page.content.length === 0) {
    return <EmptyState title={empty.title} body={empty.body} action={empty.action} />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-card border border-rule bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-rule bg-paper text-left">
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width }}
                    className={`px-4 py-2 font-medium ${
                      c.align === "right" ? "text-right" : ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.content.map((row) => (
              <tr key={row.id} className="border-b border-rule last:border-0 hover:bg-paper">
                {columns.map((c, i) => (
                  <td key={c.key}
                      className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""}`}>
                    {i === 0 && rowHref ? (
                      <Link href={rowHref(row)}
                            className="text-credential underline-offset-4 hover:underline">
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
    </>
  );
}

function Pagination<T>({
  page, onChange,
}: { page: PageResponse<T>; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-rule px-4 py-2 text-sm text-slate">
      <span>Page {page.page + 1} of {page.totalPages}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page.first}
          onClick={() => onChange(Math.max(0, page.page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page.last}
          onClick={() => onChange(page.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
