import { useMemo } from "react";
import { Chess } from "chess.js";
import { PieceTracker } from "@/Component/Chess/chessHelpers";
import { isPremoveLegal, boardFromFen, sqToRC, applyPremoveToFen } from "@/Component/Chess/Play/ChessboardFEN";
import { evaluate, findBestMove, findThreat } from "@/Library/chessEngine";
import { evalCache, bestCache, threatCache } from "@/Component/Chess/Play/EngineCache";
import type { PlayState, Premove } from "@/Component/Chess/Play/Types";

interface UseBoardOverlayProps {
  s: PlayState | null;
  live: boolean;
  reviewing: boolean;
  viewGame: Chess;
  selected: string | null;
  premoves: Premove[];
  hintArrow: { from: string; to: string } | null;
  evalBarConfig?: boolean;
  suggestionArrowsConfig?: boolean;
  threatArrowsConfig?: boolean;
  idlePieces: any[];
}

export function useBoardOverlay({
  s,
  live,
  reviewing,
  viewGame,
  selected,
  premoves,
  hintArrow,
  evalBarConfig,
  suggestionArrowsConfig,
  threatArrowsConfig,
  idlePieces,
}: UseBoardOverlayProps) {
  const premoveKey = useMemo(
    () => premoves.map((pm) => `${pm.from}${pm.to}${pm.promotion ?? ""}`).join(","),
    [premoves]
  );

  const liveFenForPieces = s?.game.fen() ?? "";

  // 1. Pieces array for current live/reviewing board state
  const pieces = useMemo(() => {
    if (!s) return idlePieces;
    if (reviewing) {
      const t = new PieceTracker();
      t.reset(viewGame);
      return t.withIds(viewGame);
    }
    return s.tracker.withIds(s.game);
  }, [s, reviewing, viewGame, liveFenForPieces, idlePieces]);

  // 2. Projected board pieces when premoves are queued
  const projectedPieces = useMemo(() => {
    if (!s || !live || premoves.length === 0) return null;
    let fen = s.game.fen();
    const t = s.tracker.clone();
    const hiddenSquares = new Set<string>();

    for (const pm of premoves) {
      if (!isPremoveLegal(fen, pm.from, pm.to, s.playerColor)) return null;
      const before = boardFromFen(fen);
      const { file: fFile, rank: fRank } = sqToRC(pm.from);
      const { file: tFile, rank: tRank } = sqToRC(pm.to);
      const moving = before[fRank][fFile];
      const targetBefore = before[tRank][tFile];
      const isEnPassant = moving?.type === "p" && fFile !== tFile && !targetBefore;
      const { fen: nextFen, hiddenKingSquare } = applyPremoveToFen(
        fen,
        pm.from,
        pm.to,
        pm.promotion ?? "q",
        s.playerColor
      );

      if (hiddenKingSquare) hiddenSquares.add(hiddenKingSquare);

      if (isEnPassant) {
        const capSq = `${"abcdefgh"[tFile]}${pm.from[1]}`;
        (t as any).ids.delete(capSq);
      } else if (targetBefore) {
        (t as any).ids.delete(pm.to);
      }
      const id = (t as any).ids.get(pm.from);
      (t as any).ids.delete(pm.from);
      if (id) (t as any).ids.set(pm.to, id);
      if (moving?.type === "k" && Math.abs(tFile - fFile) === 2) {
        const kingside = tFile > fFile;
        const rank = pm.from[1];
        const rookFrom = kingside ? `h${rank}` : `a${rank}`;
        const rookTo = kingside ? `f${rank}` : `d${rank}`;
        const rid = (t as any).ids.get(rookFrom);
        (t as any).ids.delete(rookFrom);
        if (rid) (t as any).ids.set(rookTo, rid);
      }

      fen = nextFen;
    }

    const board = boardFromFen(fen);
    const outPieces: any[] = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const p = board[rank][file];
        if (!p) continue;
        const square = `${"abcdefgh"[file]}${rank + 1}`;
        if (hiddenSquares.has(square)) continue;
        if (!(t as any).ids.has(square)) (t as any).ids.set(square, `p${(t as any).nextId++}`);
        outPieces.push({ square, color: p.color, type: p.type.toUpperCase(), id: (t as any).ids.get(square) });
      }
    }
    return outPieces;
  }, [s, live, premoveKey, liveFenForPieces]);

  // Helper calculation for projected board instance
  const projectedBoard = useMemo(() => {
    if (!s || premoves.length === 0) return null;
    let fen = s.game.fen();
    for (const pm of premoves) {
      if (!isPremoveLegal(fen, pm.from, pm.to, s.playerColor)) return null;
      fen = applyPremoveToFen(fen, pm.from, pm.to, pm.promotion ?? "q", s.playerColor).fen;
    }
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [s, premoveKey]);

  // 3. Highlighted legal target squares
  const legal: string[] = useMemo(() => {
    if (!s || !selected) return [];
    if (live && s.game.turn() !== s.playerColor) {
      const proj = projectedBoard;
      if (!proj) return [];
      const fen = proj.fen();
      const parts = fen.split(" ");
      parts[1] = s.playerColor;
      parts[3] = "-";
      try {
        const g = new Chess(parts.join(" "));
        const normal = (g.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
        const ownSquares = (proj.board().flat().filter(Boolean) as any[])
          .filter((p) => p.color === s.playerColor)
          .map((p) => p.square)
          .filter((sq) => sq !== selected && !normal.includes(sq))
          .filter((sq) => isPremoveLegal(fen, selected, sq, s.playerColor));
        return [...normal, ...ownSquares];
      } catch {
        return [];
      }
    }
    return (viewGame.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
  }, [s, selected, live, viewGame, premoveKey, projectedBoard]);

  // 4. Highlighted premove squares
  const premoveSquares = useMemo(
    () => (live ? premoves.flatMap((pm) => [pm.from, pm.to]) : []),
    [live, premoveKey]
  );

  // 5. Engine / Analysis overlay arrows and evaluation score
  const liveFenForArrows = s?.game.fen() ?? "";
  const viewFen = s ? viewGame.fen() : "";

  const evalScore = s && evalBarConfig
    ? evalCache.get(viewFen) ?? evalCache.set(viewFen, evaluate(viewGame))
    : null;

  const suggestion = s && live && suggestionArrowsConfig
    ? bestCache.get(liveFenForArrows) ?? bestCache.set(liveFenForArrows, findBestMove(s.game, 2).move)
    : null;

  const threat = s && live && threatArrowsConfig
    ? threatCache.get(liveFenForArrows) ?? threatCache.set(liveFenForArrows, findThreat(s.game))
    : null;

  const analysisArrows = useMemo(
    () => [
      ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
      ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
      ...(hintArrow ? [{ from: hintArrow.from, to: hintArrow.to, color: "hsl(48 96% 53% / 0.9)" }] : []),
    ],
    [suggestion, threat, hintArrow]
  );

  return {
    pieces,
    projectedPieces,
    projectedBoard,
    legal,
    premoveSquares,
    evalScore,
    analysisArrows,
  };
}