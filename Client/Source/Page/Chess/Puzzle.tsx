import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";

// Localized type boundaries to eliminate backend build leakage
export type PieceColor = "w" | "b";
export type PieceType = "P" | "N" | "B" | "R" | "Q" | "K";

export interface PlacedPiece {
  id?: string;
  square: string;
  type: PieceType;
  color: PieceColor;
  themed?: boolean;
  hidden?: boolean;
}

/* ── Decode fen id (chars-not-alnum replaced with '-') ──────────────── */

interface DecodedFen {
  pieces: PlacedPiece[];
  turn: PieceColor;
  orientation: "white" | "black";
}

function decodeFenId(id: string): DecodedFen | null {
  const parts = id.split("-");
  if (parts.length < 9) return null;
  const ranks = parts.slice(0, 8);
  const nonEmpty = parts.slice(8).filter(Boolean);
  const turn = (nonEmpty[0] as PieceColor) || "w";

  const pieces: PlacedPiece[] = [];
  for (let r = 0; r < 8; r++) {
    const rank = ranks[r];
    let file = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) { file += parseInt(ch, 10); continue; }
      const color: PieceColor = ch === ch.toUpperCase() ? "w" : "b";
      const type = ch.toUpperCase() as PieceType;
      if (!"KQRBNP".includes(type)) return null;
      const sq = "abcdefgh"[file] + String(8 - r);
      pieces.push({ square: sq, color, type, id: `${sq}-${type}-${color}` });
      file++;
    }
  }
  return { pieces, turn, orientation: turn === "w" ? "white" : "black" };
}

/* ── Component ──────────────────────────────────────────────────────── */

interface Props {
  puzzle?: string[] | { moves?: string[]; default?: string[] } | unknown;
  fenId?: string;
  onSolved?: () => void;
}

export function ChessPuzzleView({ puzzle, fenId, onSolved }: Props) {
  const { uiLang } = useCourseLanguage();

  // The Chess branch route passes the id via URL; also derive from location.
  const derivedId = useMemo(() => {
    if (fenId) return fenId;
    if (typeof window !== "undefined") {
      const seg = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
      return decodeURIComponent(seg);
    }
    return "";
  }, [fenId]);

  const decoded = useMemo(() => decodeFenId(derivedId), [derivedId]);
  const moves: string[] = useMemo(() => {
    if (Array.isArray(puzzle)) return puzzle as string[];
    if (puzzle && typeof puzzle === "object") return (puzzle as any).moves ?? [];
    return [];
  }, [puzzle]);

  const [pieces, setPieces] = useState<PlacedPiece[]>(decoded?.pieces ?? []);
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setPieces(decoded?.pieces ?? []);
    setStep(0);
    setLastMove(null);
    setSelected(null);
  }, [decoded]);

  const applyUci = (uci: string, current: PlacedPiece[]) => {
    const from = uci.slice(0, 2);
    const to   = uci.slice(2, 4);
    const promo = uci.slice(4, 5);
    const next = current
      .filter(p => p.square !== to)
      .map(p => p.square === from
        ? { ...p, square: to, type: (promo ? promo.toUpperCase() : p.type) as PieceType }
        : p);
    return { pieces: next, from, to };
  };

  const solved = step >= moves.length && moves.length > 0;

  const attemptMove = (from: string, to: string) => {
    if (solved) return;
    const expected = moves[step];
    if (!expected) return;
    const okUci = `${from}${to}`;
    if (!expected.startsWith(okUci)) {
      setWrong(true);
      window.setTimeout(() => setWrong(false), 500);
      return;
    }
    // apply user move
    const applied = applyUci(expected, pieces);
    setPieces(applied.pieces);
    setLastMove({ from: applied.from, to: applied.to });
    setSelected(null);

    // apply opponent reply (next move in sequence), if any
    const nextIdx = step + 1;
    if (nextIdx < moves.length) {
      window.setTimeout(() => {
        setPieces(prev => {
          const r = applyUci(moves[nextIdx], prev);
          setLastMove({ from: r.from, to: r.to });
          return r.pieces;
        });
        setStep(nextIdx + 1);
      }, 400);
    } else {
      setStep(nextIdx);
    }
  };

  const reset = () => {
    setPieces(decoded?.pieces ?? []);
    setStep(0);
    setLastMove(null);
    setSelected(null);
  };

  if (!decoded) {
    return (
      <div className="px-4 max-w-md mx-auto py-8">
        <Container className="p-6 text-center text-sm opacity-70">
          {uiLang === "nl" ? "Kon puzzel niet laden." : uiLang === "ar" ? "تعذّر تحميل اللغز." : "Could not load puzzle."}
        </Container>
      </div>
    );
  }

  const title = uiLang === "nl" ? "Puzzel" : uiLang === "ar" ? "لغز" : "Puzzle";
  const yourMove = solved
    ? (uiLang === "nl" ? "Opgelost!" : uiLang === "ar" ? "تم الحل!" : "Solved!")
    : (decoded.turn === "w"
        ? (uiLang === "nl" ? "Wit aan zet — vind de beste zet." : uiLang === "ar" ? "الأبيض يلعب — جد أفضل نقلة." : "White to move — find the best move.")
        : (uiLang === "nl" ? "Zwart aan zet — vind de beste zet." : uiLang === "ar" ? "الأسود يلعب — جد أفضل نقلة." : "Black to move — find the best move."));

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_260px] max-w-5xl mx-auto">
        <div className="flex justify-center">
          <Container className={`p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-18rem))] md:max-w-none transition-all ${wrong ? "ring-2 ring-destructive" : ""}`}>
            <Chessboard
              pieces={pieces}
              orientation={decoded.orientation}
              selected={selected}
              lastMove={lastMove}
              onSquareClick={(sq) => {
                if (!selected) {
                  const p = pieces.find(x => x.square === sq);
                  if (p && p.color === decoded.turn) setSelected(sq);
                  return;
                }
                if (sq === selected) { setSelected(null); return; }
                attemptMove(selected, sq);
              }}
              onPieceDrop={(from, to) => attemptMove(from, to)}
              onClearSelection={() => setSelected(null)}
              interactiveColor={decoded.turn}
            />
          </Container>
        </div>

        <div className="flex flex-col gap-3">
          <Container className="p-3 text-sm space-y-1">
            <p className="font-semibold">{title}</p>
            <p className="opacity-70">{yourMove}</p>
            <p className="text-xs opacity-60 tabular-nums">
              {step}/{moves.length}
            </p>
          </Container>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              {uiLang === "nl" ? "Opnieuw" : uiLang === "ar" ? "إعادة" : "Reset"}
            </Button>
            {solved && onSolved && (
              <Button className="flex-1" onClick={onSolved}>
                {uiLang === "nl" ? "Volgende" : uiLang === "ar" ? "التالي" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}