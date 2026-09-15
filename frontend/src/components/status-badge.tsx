import { cn, getStatusColor, getStatusBgColor } from "@/lib/utils";

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const label = children || status.replaceAll("_", " ").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide capitalize",
        getStatusBgColor(status),
        getStatusColor(status),
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          getStatusColor(status).replace("text-", "bg-")
        )}
      />
      {label}
    </span>
  );
}
