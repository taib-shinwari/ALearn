import { useEffect, useRef } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { CLASS_META, type ClassKind } from "./analysis/classification";

interface Props {
  sans: string[];
  /** Seconds taken for each move, same index as sans. Omit/empty to hide. */
  times?: number[];
  showTimes?: boolean;
  /** -1 (or undefined) = live/latest. Otherwise index into sans of the move currently shown. */
  activeIndex?: number;
  /** Optional per-move classification kind. */
  classifications?: (ClassKind | undefined)[];
  onSelect?: (index: number) => void;
}

export function MovesList({
  sans, times = [], showTimes = false, activeIndex = -1,
  classifications, onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [sans.length, activeIndex]);

  const pairs: Array<{
    w: { san: string; idx: number; t?: number; k?: ClassKind };
    b?: { san: string; idx: number; t?: number; k?: ClassKind };
  }> = [];
  for (let i = 0; i < sans.length; i += 2) {
    pairs.push({
      w: { san: sans[i], idx: i, t: times[i], k: classifications?.[i] },
      b: sans[i + 1] != null
        ? { san: sans[i + 1], idx: i + 1, t: times[i + 1], k: classifications?.[i + 1] }
        : undefined,
    });
  }

  const Cell = ({ san, idx, t, k }: { san: string; idx: number; t?: number; k?: ClassKind }) => {
    const meta = k ? CLASS_META[k] : null;
    const active = activeIndex === idx;
    return (
      <button
        type="button"
        onClick={() => onSelect?.(idx)}
        className={cn(
          "px-1.5 py-0.5 rounded text-left flex items-baseline justify-between gap-2 transition-colors w-full",
          meta?.bg,
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

  return (
    <Container className="p-2">
      <div ref={ref} className="max-h-[260px] overflow-y-auto font-mono text-sm">
        {pairs.length === 0 && <p className="opacity-60 text-center py-4">—</p>}
        {pairs.map((p, i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-1 px-1 py-0.5 items-center">
            <span className="opacity-60">{i + 1}.</span>
            <Cell {...p.w} />
            {p.b ? <Cell {...p.b} /> : <span />}
          </div>
        ))}
      </div>
    </Container>
  );
}
