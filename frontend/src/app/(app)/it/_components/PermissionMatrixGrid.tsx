"use client";

import type { PermissionMatrix } from "../_hooks/useConfig";
import { Check, X, Shield, Lock, Key } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  matrix: PermissionMatrix;
  onToggle: (levelId: number, areaId: number, granted: boolean) => void;
  readOnly?: boolean;
};

export function PermissionMatrixGrid({ matrix, onToggle, readOnly }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">
            Access levels down the side, areas across the top. A checkmark indicates granted physical access.
          </caption>
          <thead>
            <tr className="border-b border-rule bg-slate-50/80">
              <th scope="col" className="sticky left-0 z-10 bg-slate-50/95 px-5 py-3.5 text-left font-bold text-slate-700 backdrop-blur-xs min-w-56">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-credential" />
                  <span>Access Level Tier</span>
                </div>
              </th>
              {matrix.areas.map((area) => (
                <th
                  key={area.areaId}
                  scope="col"
                  className="px-3.5 py-3.5 text-center align-bottom font-bold text-slate-700 min-w-28 border-l border-rule/50"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="identifier text-xs font-mono font-bold text-ink">{area.areaCode}</span>
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-24">
                      {area.areaName}
                    </span>
                    {area.restricted && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700">
                        <Lock className="h-2.5 w-2.5" />
                        Restricted
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {matrix.levels.map((level) => {
              const grantedCount = level.permitted.filter(Boolean).length;
              return (
                <tr key={level.levelId} className="hover:bg-blue-50/30 transition-colors group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface group-hover:bg-slate-50 px-5 py-3 text-left font-normal transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="identifier font-bold text-xs text-ink">{level.levelCode}</span>
                          {!level.active && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-0.5">{level.levelName}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {grantedCount}/{matrix.areas.length}
                      </span>
                    </div>
                  </th>
                  {level.permitted.map((granted, i) => {
                    const targetArea = matrix.areas[i];
                    return (
                      <td key={i} className="px-3 py-3 text-center border-l border-rule/40">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => onToggle(level.levelId, targetArea.areaId, !granted)}
                          aria-label={`${level.levelName} ${granted ? "permits" : "does not permit"} ${targetArea.areaName}. Click to change.`}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-xl border transition-all cursor-pointer",
                            granted
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-2xs hover:bg-emerald-100"
                              : "border-slate-200 bg-paper text-slate-300 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-100",
                            readOnly && "cursor-not-allowed opacity-60"
                          )}
                          title={granted ? `Granted: ${targetArea.areaName}` : `Grant access to ${targetArea.areaName}`}
                        >
                          {granted ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <span className="text-xs font-bold text-slate-300 group-hover:text-slate-400">+</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
