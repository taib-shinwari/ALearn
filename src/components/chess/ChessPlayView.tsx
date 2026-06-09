import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chess/Chessboard";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { RotateCcw } from "lucide-react";
import { fenToPieces, pickBotMove } from "./chessHelpers";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useChessSettings } from "@/lib/chessSettings";

export function ChessPlayView() {
  const { uiLang } = useCourseLanguage();
  const [settings] = useChessSettings();
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<string | null>(null);
  const [, force] = useState(0);

  const pieces = useMemo(() => fenToPieces(game), [game, game.fen()]);
  const turn = game.turn(); // 'w' | 'b'
  const playerColor: "w" = "w";

  const status = game.isCheckmate()
    ? (uiLang === "nl" ? "Schaakmat" : uiLang === "ar" ? "كش مات" : "Checkmate")
    : game.isStalemate()
    ? (uiLang === "nl" ? "Pat" : uiLang === "ar" ? "تعادل" : "Stalemate")
    : game.isDraw()
    ? (uiLang === "nl" ? "Remise" : uiLang === "ar" ? "تعادل" : "Draw")
    : game.inCheck()
    ? (uiLang === "nl" ? "Schaak!" : uiLang === "ar" ? "كش!" : "Check!")
    : turn === playerColor
      ? (uiLang === "nl" ? "Jouw zet" : uiLang === "ar" ? "دورك" : "Your move")
      : (uiLang === "nl" ? "Bot denkt..." : uiLang === "ar" ? "البوت يفكر..." : "Bot thinking...");

  const doBotMove = (g: Chess) => {
    setTimeout(() => {
      const mv = pickBotMove(g);
      if (mv) {
        g.move({ from: mv.from, to: mv.to, promotion: mv.promotion ?? "q" });
        force(n => n + 1);
      }
    }, 300);
  };

  const handleSquare = (sq: string) => {
    if (game.isGameOver()) return;
    if (turn !== playerColor) return;
    if (!selected) {
      const piece = game.get(sq as any);
      if (piece && piece.color === playerColor) setSelected(sq);
      return;
    }
    if (sq === selected) { setSelected(null); return; }
    try {
      const move = game.move({ from: selected, to: sq, promotion: "q" });
      if (move) {
        setSelected(null);
        force(n => n + 1);
        if (!game.isGameOver()) doBotMove(game);
      } else setSelected(null);
    } catch {
      setSelected(null);
    }
  };

  const reset = () => {
    const g = new Chess();
    setGame(g);
    setSelected(null);
    force(n => n + 1);
  };

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] max-w-5xl mx-auto">
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <Chessboard
              pieces={pieces}
              orientation="white"
              selected={selected}
              onSquareClick={handleSquare}
              animate={settings.animatePieces}
              animationMs={settings.animationSpeed}
            />
          </Container>
        </div>
        <div className="flex flex-col gap-3">
          <Container className="p-3 text-sm font-semibold text-center">{status}</Container>
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {uiLang === "nl" ? "Nieuw spel" : uiLang === "ar" ? "لعبة جديدة" : "New game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
