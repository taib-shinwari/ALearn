import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Pair = { target: string; translation: string; wordId: string };
type Tile = { id: string; text: string; side: "t" | "u"; wordId: string };

interface Props {
  pairs: Pair[];
  onComplete: (perfect: boolean, perWord: Record<string, boolean>) => void;
}

/** 4-pair match game. Calls onComplete when all pairs are found. */
export function MatchPairs({ pairs, onComplete }: Props) {
  const tiles = useMemo<Tile[]>(() => {
    const xs: Tile[] = [];
    for (const p of pairs) {
      xs.push({ id: `t-${p.wordId}`, text: p.target, side: "t", wordId: p.wordId });
      xs.push({ id: `u-${p.wordId}`, text: p.translation, side: "u", wordId: p.wordId });
    }
    return xs.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Tile | null>(null);
  const [wrongFlash, setWrongFlash] = useState<Set<string>>(new Set());
  // Track per-word: false the moment user makes a wrong tap on this pair
  const [perWord, setPerWord] = useState<Record<string, boolean>>(
    () => Object.fromEntries(pairs.map(p => [p.wordId, true])),
  );
  const [wrongTotal, setWrongTotal] = useState(0);

  const tap = (tile: Tile) => {
    if (matched.has(tile.wordId)) return;
    if (!selected) { setSelected(tile); return; }
    if (selected.id === tile.id) { setSelected(null); return; }

    if (selected.wordId === tile.wordId && selected.side !== tile.side) {
      const next = new Set(matched); next.add(tile.wordId);
      setMatched(next);
      setSelected(null);
      if (next.size === pairs.length) {
        const perfect = wrongTotal === 0;
        // Defer to next tick so the final tile renders matched
        setTimeout(() => onComplete(perfect, perWord), 250);
      }
    } else {
      const flash = new Set([selected.id, tile.id]);
      setWrongFlash(flash);
      setWrongTotal(w => w + 1);
      setPerWord(pw => ({ ...pw, [selected.wordId]: false, [tile.wordId]: false }));
      setTimeout(() => { setWrongFlash(new Set()); setSelected(null); }, 450);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(t => {
        const isMatched = matched.has(t.wordId);
        const isSel = selected?.id === t.id;
        const isWrong = wrongFlash.has(t.id);
        return (
          <Button
            key={t.id}
            disabled={isMatched}
            active={isSel}
            variant={isWrong ? "destructive" : isMatched ? "primary" : "secondary"}
            onClick={() => tap(t)}
            className={cn("h-12 justify-center text-sm", isMatched && "opacity-60")}
          >
            {isMatched ? <Check className="h-4 w-4" /> : t.text}
          </Button>
        );
      })}
    </div>
  );
}
