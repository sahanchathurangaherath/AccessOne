const TONE: Record<string, "granted" | "denied" | "pending" | "neutral"> = {
  ACTIVE: "granted", APPROVED: "granted", GRANTED: "granted", PASS: "granted", APPROVE: "granted",
  REVOKED: "denied", REJECTED: "denied", DENIED: "denied", REJECT: "denied", REVOKE: "denied",
  CANCELLED: "denied", VOID: "denied", FAIL: "denied",
  SUBMITTED: "pending", UNDER_VERIFICATION: "pending", QUEUED: "pending",
  DRAFT: "neutral", PRINTED: "neutral", DISPATCHED: "neutral",
};

const CLASS = {
  granted: "border-granted/30 bg-granted/10 text-granted",
  denied:  "border-denied/30 bg-denied/10 text-denied",
  pending: "border-pending/30 bg-pending/10 text-pending",
  neutral: "border-rule bg-paper text-slate",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? "neutral";
  return (
    <span className={`inline-block rounded-card border px-2 py-0.5 text-xs font-medium ${CLASS[tone]}`}>
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
