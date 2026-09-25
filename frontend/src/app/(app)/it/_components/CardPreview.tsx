import type { CardDetail } from "../_hooks/useCards";
import { ShieldCheck, Wifi, User } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

/**
 * High-production CR80 Smart Badge Visualizer.
 * Renders precise physical card proportions (85.6 x 54mm) with security chip,
 * organization banner, employee credentials, and dynamic status watermark.
 */
export function CardPreview({ card }: { card: CardDetail }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none transition-transform duration-300 hover:scale-[1.01]"
        style={{ width: "348px", height: "220px" }}
      >
        {/* Top Header Ribbon */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-4 py-2.5 text-white shadow-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-200" />
            <span className="identifier text-[10px] font-extrabold tracking-[0.25em] text-white">
              ACCESSONE
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5 rotate-90 text-blue-200" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-blue-100">
              SMART PASS
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex gap-3.5 p-3.5">
          {/* Employee Photo */}
          <div className="relative flex-shrink-0 h-[104px] w-[82px]">
            <img
              src={`/api/v1/cards/${card.id}/photo`}
              alt={card.printedName}
              onError={(e) => {
                // Fallback to placeholder if backend photo is missing
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='100' viewBox='0 0 80 100'%3E%3Crect width='80' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%2394a3b8'%3EPHOTO%3C/text%3E%3C/svg%3E";
              }}
              className="h-[104px] w-[82px] rounded-lg border border-slate-200 object-cover shadow-xs"
            />
            {/* Smart EMV Chip simulation */}
            <div className="absolute bottom-1 right-1 h-5 w-6 rounded border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-xs flex items-center justify-center">
              <div className="h-3 w-4 border border-amber-400/70 rounded-[2px]" />
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1 pt-0.5" style={{ maxWidth: "140px" }}>
            <p className="truncate text-[15px] font-black text-slate-950 tracking-tight leading-tight">
              {card.printedName}
            </p>
            <p className="truncate text-[11.5px] font-bold text-[#1F4B8E] leading-tight">
              {card.printedDesignation}
            </p>
            <p className="truncate text-[10.5px] text-slate-500 font-medium">
              {card.printedDepartment}
            </p>

            <div className="pt-1.5">
              <p className="font-mono text-[13px] font-black text-slate-900 tracking-wider">
                {card.empId}
              </p>
            </div>
          </div>
        </div>

        {/* Scaled 96px QR Code (Bottom-Right) */}
        <div className="absolute bottom-2 right-2.5 flex flex-col items-center">
          <img
            src={`/api/v1/cards/${card.id}/qr?size=240`}
            alt="QR Code"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23f8fafc'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%231e293b'/%3E%3Crect x='60' y='12' width='24' height='24' fill='%231e293b'/%3E%3Crect x='12' y='60' width='24' height='24' fill='%231e293b'/%3E%3C/svg%3E";
            }}
            className="h-[96px] w-[96px] rounded-lg border border-slate-300 bg-white p-1 shadow-xs"
          />
          <span className="text-[7.5px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
            VERIFY SCAN
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3.5 flex items-center gap-2">
          <p className="identifier font-mono text-[9.5px] font-bold tracking-wider text-slate-500">
            {card.cardSerial}
          </p>
          <StatusBadge status={card.status} className="scale-90 origin-left" />
        </div>
      </div>
    </div>
  );
}
