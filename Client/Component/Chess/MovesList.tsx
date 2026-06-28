import { useEffect, useRef } from "react";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";
import { CLASS_META, type ClassKind } from "./analysis/classification";

export interface MoveVariation {
  /** Mainline ply index this branch *replaces* (the move played instead of mainline[parentIndex]). */
  parentIndex: number;
  sans: string[];
}

export interface VariationCursor {
  varIndex: number; // index into variations[]
  step: number;     // ply within that variation
}

interface Props {
  sans: string[];
  times?: number[];
  showTimes?: boolean;
  activeIndex?: number;
  classifications?: (ClassKind | undefined)[];
  variations?: MoveVariation[];
  activeCursor?: VariationCursor | null;
  onSelect?: (index: number) => void;
  onSelectVariation?: (cursor: VariationCursor) => void;
}

export function MovesList({
  sans, times = [], showTimes = false, activeIndex = -1,
  classifications, variations = [], activeCursor, onSelect, onSelectVariation,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [sans.length, activeIndex, variations.length]);

  const Cell = ({
    san, idx, t, k, active,
  }: { san: string; idx: number; t?: number; k?: ClassKind; active: boolean }) => {
    const meta = k ? CLASS_META[k] : null;
    return (
      <button
        type="button"
        onClick={() => onSelect?.(idx)}
        className={cn(
          "px-1.5 py-0.5 rounded text-left flex items-baseline justify-between gap-2 transition-colors w-full",
          meta?.text,
          !active && "hover:bg-muted/60",
          active && "ring-2 ring-foreground/70",
        )}
      >
        <span className="flex items-baseline gap-1">
          <span>{san}</span>
          {meta && <span aria-hidden className="text-xs leading-none">{meta.glyph}</span>}
        </span>
        {showTimes && t != null && (
          <span className="text-[10px] opacity-60 tabular-nums">
            {Math.max(0, Math.round(t))}s
          </span>
        )}
      </button>
    );
  };

  // Build per-mainline-row buckets so variations render under the right pair.
  const rows: Array<{
    moveNum: number;
    w?: { san: string; idx: number; t?: number; k?: ClassKind };
    b?: { san: string; idx: number; t?: number; k?: ClassKind };
  }> = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({
      moveNum: i / 2 + 1,
      w: { san: sans[i], idx: i, t: times[i], k: classifications?.[i] },
      b: sans[i + 1] != null
        ? { san: sans[i + 1], idx: i + 1, t: times[i + 1], k: classifications?.[i + 1] }
        : undefined,
    });
  }

  const variationsByParent = new Map<number, { v: MoveVariation; varIndex: number }[]>();
  variations.forEach((v, vi) => {
    const arr = variationsByParent.get(v.parentIndex) ?? [];
    arr.push({ v, varIndex: vi });
    variationsByParent.set(v.parentIndex, arr);
  });

  const renderVariation = (entry: { v: MoveVariation; varIndex: number }) => {
    const { v, varIndex } = entry;
    const moveNum0 = Math.floor(v.parentIndex / 2) + 1;
    const startsWithBlack = v.parentIndex % 2 === 1;
    return (
      <div key={`var-${varIndex}`} className="pl-6 py-0.5 text-xs font-mono opacity-90 flex flex-wrap items-baseline gap-x-1">
        <span className="opacity-60">|_</span>
        {v.sans.map((san, step) => {
          const ply = v.parentIndex + step;
          const isBlackMove = ply % 2 === 1;
          const num = moveNum0 + (startsWithBlack ? Math.floor((step + 1) / 2) : Math.floor(step / 2));
          const label = isBlackMove ? `${num}...` : `${num}.`;
          const active = activeCursor?.varIndex === varIndex && activeCursor.step === step;
          return (
            <button
              key={step}
              onClick={() => onSelectVariation?.({ varIndex, step })}
              className={cn(
                "px-1 rounded hover:bg-muted/60",
                active && "ring-2 ring-foreground/70 bg-muted/40",
              )}
            >
              <span className="opacity-60 mr-1">{label}</span>{san}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Container className="p-2">
      <div ref={ref} className="max-h-[260px] overflow-y-auto font-mono text-sm">
        {rows.length === 0 && <p className="opacity-60 text-center py-4">—</p>}
        {rows.map((p, i) => {
          const whiteVars = variationsByParent.get(p.w!.idx) ?? [];
          const blackVars = p.b ? (variationsByParent.get(p.b.idx) ?? []) : [];
          const inMainline = activeCursor == null;
          return (
            <div key={i}>
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-1 px-1 py-0.5 items-center">
                <span className="opacity-60">{p.moveNum}.</span>
                <Cell {...p.w!} active={inMainline && activeIndex === p.w!.idx} />
                {p.b
                  ? <Cell {...p.b} active={inMainline && activeIndex === p.b.idx} />
                  : <span />}
              </div>
              {whiteVars.map(renderVariation)}
              {blackVars.map(renderVariation)}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
