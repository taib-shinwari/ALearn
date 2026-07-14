import { cn } from "@/Library/utils";

export function EvalBar({ score }: { score: number }) {
  const clamped = Math.max(-1000, Math.min(1000, score));
  const whitePct = 50 + (clamped / 1000) * 50;
  const pawns = score / 100;
  const sign = pawns > 0 ? "+" : pawns < 0 ? "" : "";
  const label = Math.abs(pawns) >= 10 ? `${sign}${pawns.toFixed(0)}` : `${sign}${pawns.toFixed(1)}`;
  return (
    <div
      className="relative w-6 rounded-[8px] overflow-hidden bg-neutral-800 border-2 border-border flex flex-col shrink-0"
      aria-hidden
    >
      <div
        className="absolute left-0 right-0 bottom-0 bg-neutral-100 transition-[height] duration-200"
        style={{ height: `${whitePct}%` }}
      />
      <span
        className={cn(
          "absolute left-0 right-0 text-center text-[10px] font-bold font-mono leading-none",
          pawns >= 0 ? "bottom-0.5 text-neutral-900" : "top-0.5 text-neutral-100",
        )}
      >
        {label}
      </span>
    </div>
  );
}