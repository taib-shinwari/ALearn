// Panel rendered above the moves list. Shows:
// - the move just played (SAN + classification + explanation)
// - the engine's preferred follow-up line; hovering a move previews the position.
import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/Component/UI/container";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/Component/UI/hover-card";
import { cn } from "@/Library/utils";
import { Chessboard } from "./Chessboard";
import { PieceTracker } from "./chessHelpers";
import { CLASS_META, explainMove, type PerMove } from "./analysis/classification";
import { sfBestLine } from "@/Library/stockfish";

type FollowUp = { index: number; san: string; fen: string; isEngine: boolean };

// Small FEN-keyed cache so navigating back and forth over the same plies in
// review doesn't re-trigger a fresh Stockfish search each time. Capped so it
// doesn't grow unbounded over a long review session.
const engineLineCache = new Map<string, FollowUp[]>();
const ENGINE_LINE_CACHE_LIMIT = 200;

interface Props {
  sans: string[];
  fens: string[];          // length = sans.length + 1
  currentIndex: number;    // -1 = before first move
  perMove?: PerMove[];
  orientation?: "white" | "black";
  /** When true, the engine's best line is shown (analysis/review mode). */
  showBestLine?: boolean;
  onSelect?: (index: number) => void;
}

function moveLabel(index: number): string {
  const n = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${n}.` : `${n}...`;
}

export function MoveDetailPanel({
  sans, fens, currentIndex, perMove, orientation = "white", showBestLine = false, onSelect,
}: Props) {
  const current = currentIndex >= 0 && currentIndex < sans.length
    ? { san: sans[currentIndex], kind: perMove?.[currentIndex]?.kind, cpl: perMove?.[currentIndex]?.cpl ?? 0 }
    : null;

  // Mainline upcoming moves (cheap, synchronous — no engine call needed).
  const mainlineFollowUps = useMemo<FollowUp[]>(() => {
    if (showBestLine) return [];
    const start = currentIndex + 1;
    const out: FollowUp[] = [];
    for (let i = start; i < Math.min(sans.length, start + 3); i++) {
      out.push({ index: i, san: sans[i], fen: fens[i + 1], isEngine: false });
    }
    return out;
  }, [sans, fens, currentIndex, showBestLine]);

  // Engine's best line (analysis/review mode) — computed via Stockfish
  // (MultiPV) off the main thread, never blocking the click/render that
  // triggers it. Cached by FEN so re-visiting a ply doesn't re-search.
  const engineFen = showBestLine ? fens[currentIndex + 1] : undefined;
  const [engineFollowUps, setEngineFollowUps] = useState<FollowUp[]>(
    () => (engineFen && engineLineCache.has(engineFen) ? engineLineCache.get(engineFen)! : []),
  );
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!showBestLine || !engineFen) {
      setEngineFollowUps([]);
      return;
    }
    const cached = engineLineCache.get(engineFen);
    if (cached) {
      setEngineFollowUps(cached);
      return;
    }
    // Stale results from a previous fen shouldn't flash before the new
    // search resolves; clear immediately, then fill in once ready.
    setEngineFollowUps([]);
    const myRequestId = ++requestIdRef.current;
    const baseIndex = currentIndex;
    const fen = engineFen;
    sfBestLine(fen, { depth: 14, lines: 1 })
      .then((lines) => {
        if (requestIdRef.current !== myRequestId) return; // superseded by a newer request
        const pv = lines[0]?.pv ?? [];
        const proj = new Chess(fen);
        const result: FollowUp[] = [];
        for (let k = 0; k < Math.min(pv.length, 4); k++) {
          const uci = pv[k];
          const from = uci.slice(0, 2);
          const to = uci.slice(2, 4);
          const promotion = uci.length > 4 ? uci[4] : undefined;
          let san = `${from}${to}`;
          try {
            const mv = proj.move({ from, to, promotion: promotion ?? "q" });
            if (mv) san = mv.san;
            else break;
          } catch { break; }
          result.push({ index: baseIndex + 1 + k, san, fen: proj.fen(), isEngine: true });
        }
        if (engineLineCache.size > ENGINE_LINE_CACHE_LIMIT) engineLineCache.clear();
        engineLineCache.set(fen, result);
        setEngineFollowUps(result);
      })
      .catch(() => {
        if (requestIdRef.current === myRequestId) setEngineFollowUps([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBestLine, engineFen, currentIndex]);

  const followUps = showBestLine ? engineFollowUps : mainlineFollowUps;

  const explanation = current && current.kind
    ? explainMove(current.kind, current.cpl)
    : null;

  return (
    <Container className="p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-3 min-h-[1.25rem]">
        <span className="text-[10px] uppercase tracking-wider opacity-60">Last move</span>
        {current ? (
          <span className="font-mono text-sm">
            <span className="opacity-60 mr-1">{moveLabel(currentIndex)}</span>
            <span>{current.san}</span>
            {current.kind && (
              <span className={cn("ml-2 font-bold", CLASS_META[current.kind].text)}>
                {CLASS_META[current.kind].glyph}
              </span>
            )}
          </span>
        ) : (
          <span className="opacity-50 text-xs">—</span>
        )}
      </div>

      {explanation && (
        <p className={cn("text-xs leading-snug", current?.kind && CLASS_META[current.kind].text)}>
          {explanation}
        </p>
      )}

      {followUps.length > 0 && (
        <div className="border-t border-border/60 pt-2">
          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
            {showBestLine ? "Engine line" : "Coming up"}
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {followUps.map(m => (
              <HoverCard key={`${m.index}-${m.san}`} openDelay={120} closeDelay={60}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => !showBestLine && onSelect?.(m.index)}
                    className={cn(
                      "px-1.5 py-0.5 rounded hover:bg-muted/60",
                      showBestLine && "text-emerald-400",
                    )}
                  >
                    <span className="opacity-60 mr-1">{moveLabel(m.index)}</span>
                    {m.san}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="left" className="w-56 p-2">
                  <MiniBoard fen={m.fen} orientation={orientation} />
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

function MiniBoard({ fen, orientation }: { fen: string; orientation: "white" | "black" }) {
  const pieces = useMemo(() => {
    try {
      const g = new Chess(fen);
      const t = new PieceTracker();
      t.reset(g);
      return t.withIds(g);
    } catch { return []; }
  }, [fen]);
  return <Chessboard pieces={pieces} interactive={false} animate={false} orientation={orientation} />;
}