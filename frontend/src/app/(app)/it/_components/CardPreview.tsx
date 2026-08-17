import type { CardDetail } from "../_hooks/useCards";

/**
 * Renders the same layout as the printed PDF (card-layout.html), at card
 * proportions, so what someone sees here is what will print. Two layouts
 * would drift.
 */
export function CardPreview({ card }: { card: CardDetail }) {
  return (
    <div
      className="relative overflow-hidden rounded-card border border-rule bg-surface shadow-sm"
      style={{ width: "342px", height: "216px" }}   /* 85.6 x 54mm at 4x */
    >
      <div className="identifier bg-credential px-4 py-2 text-[10px] tracking-[0.2em] text-white">
        CEYLON METRO HOLDINGS
      </div>

      <div className="flex gap-4 px-4 pt-3">
        <img
          src={`/api/v1/cards/${card.id}/photo`}
          alt=""
          className="h-[100px] w-[80px] border border-rule object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{card.printedName}</p>
          <p className="truncate text-sm text-slate">{card.printedDesignation}</p>
          <p className="truncate text-sm text-slate">{card.printedDepartment}</p>
          <p className="identifier mt-2 text-sm">{card.empId}</p>
        </div>
      </div>

      <img
        src={`/api/v1/cards/${card.id}/qr?size=160`}
        alt=""
        className="absolute bottom-3 right-3 h-[76px] w-[76px]"
      />
      <p className="identifier absolute bottom-3 left-4 text-[11px]">
        {card.cardSerial}
      </p>
    </div>
  );
}
