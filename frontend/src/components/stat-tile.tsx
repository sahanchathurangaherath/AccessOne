import Link from "next/link";

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "denied" | "pending";
  href?: string;
};

/** Every tile that counts something links to the list of those things -- a number you cannot click is a number you cannot act on. */
export function StatTile({ label, value, hint, tone = "neutral", href }: Props) {
  const body = (
    <div className="rounded-card border border-rule bg-surface p-4">
      <p className="text-sm text-slate">{label}</p>
      <p
        className={`identifier mt-1 text-3xl font-semibold ${
          tone === "denied" ? "text-denied" : tone === "pending" ? "text-pending" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:border-credential/40">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatTileRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
