import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Visual SLA Ageing Indicator carrying status in text and iconography */
export function AgeingIndicator({ hours, flag }: { hours: number; flag: string }) {
  const isOverdue = flag === "OVERDUE";
  const isAgeing = flag === "AGEING";

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold identifier",
          isOverdue
            ? "bg-red-50 text-red-700 border border-red-200 shadow-2xs"
            : isAgeing
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-slate-50 text-slate-600 border border-slate-200"
        )}
      >
        {isOverdue && <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse" />}
        {isAgeing && <Clock className="h-3 w-3 text-amber-600" />}
        {!isOverdue && !isAgeing && <CheckCircle2 className="h-3 w-3 text-slate-400" />}
        <span>{hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`}</span>
      </span>
      {flag !== "NORMAL" && (
        <span className="sr-only"> — {flag.toLowerCase()}</span>
      )}
    </div>
  );
}

