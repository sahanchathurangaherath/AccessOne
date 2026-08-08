/** Status is carried in text (the sr-only span), never colour alone -- same rule as StatusBadge. */
export function AgeingIndicator({ hours, flag }: { hours: number; flag: string }) {
  const tone = flag === "OVERDUE" ? "text-denied"
             : flag === "AGEING"  ? "text-pending"
             : "text-slate";
  return (
    <span className={`identifier text-sm ${tone}`}>
      {hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`}
      {flag !== "NORMAL" && (
        <span className="sr-only"> — {flag.toLowerCase()}</span>
      )}
    </span>
  );
}
