"use client";

import type { PermissionMatrix } from "../_hooks/useConfig";

type Props = {
  matrix: PermissionMatrix;
  onToggle: (levelId: number, areaId: number, granted: boolean) => void;
  readOnly?: boolean;
};

/**
 * Three accessibility details that cost almost nothing: the <caption>
 * explains the grid to a screen reader, which cannot see a grid;
 * scope="col"/"row" are how a screen reader announces "Level 2, Server
 * Room" instead of reading a bare cell; and the aria-label on each button
 * states the current state and what activating it will do, since a tick
 * mark alone is meaningless out of context.
 */
export function PermissionMatrixGrid({ matrix, onToggle, readOnly }: Props) {
  return (
    <div className="overflow-x-auto rounded-card border border-rule bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">
          Access levels down the side, areas across the top. A tick means
          the level permits entry to that area.
        </caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="sticky left-0 bg-surface px-4 py-3 text-left font-medium">
              Access level
            </th>
            {matrix.areas.map((area) => (
              <th key={area.areaId} scope="col"
                  className="px-3 py-3 text-center align-bottom font-medium">
                <span className="identifier block text-xs">{area.areaCode}</span>
                {area.restricted && (
                  <span className="mt-1 block text-[10px] uppercase tracking-wide text-pending">
                    restricted
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.levels.map((level) => (
            <tr key={level.levelId} className="border-b border-rule last:border-0">
              <th scope="row"
                  className="sticky left-0 bg-surface px-4 py-2 text-left font-normal">
                <span className="identifier">{level.levelCode}</span>
                <span className="ml-2 text-slate">{level.levelName}</span>
                {!level.active && (
                  <span className="ml-2 text-xs text-slate">(inactive)</span>
                )}
              </th>
              {level.permitted.map((granted, i) => (
                <td key={i} className="px-3 py-2 text-center">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => onToggle(level.levelId, matrix.areas[i].areaId, !granted)}
                    aria-label={`${level.levelName} ${granted ? "permits" : "does not permit"} ${matrix.areas[i].areaName}. Activate to change.`}
                    className={`h-6 w-6 rounded border ${
                      granted
                        ? "border-granted/40 bg-granted/15 text-granted"
                        : "border-rule bg-paper text-slate"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {granted ? "✓" : ""}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
