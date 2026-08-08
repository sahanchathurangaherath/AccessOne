type Status = "granted" | "denied" | "pending" | "neutral";

const DOT: Record<Status, string> = {
  granted: "bg-granted",
  denied: "bg-denied",
  pending: "bg-pending",
  neutral: "bg-slate",
};

export function CredentialChip({
  serial,
  status = "neutral",
  label,
}: {
  serial: string;
  status?: Status;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-card border border-rule bg-surface px-2 py-1">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${DOT[status]}`}
        aria-hidden="true"
      />
      <span className="identifier text-sm">{serial}</span>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
