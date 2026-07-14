import type { Chess } from "chess.js";
import type { PieceTracker } from "./chessHelpers";
import type { GameConfig } from "./ChessSetupPanel";
import type { MoveVariation } from "./MovesList";

export interface VariationData extends MoveVariation {
  fens: string[];               // fens from parent position onward; length = sans.length + 1
  lastMoves: Array<{ from: string; to: string }>;
}

export interface PlayState {
  game: Chess;
  tracker: PieceTracker;
  playerColor: "w" | "b";
  sans: string[];
  moveTimes: number[];
  fenHistory: string[];
  lastMoves: Array<{ from: string; to: string }>;
  whiteMs: number;
  blackMs: number;
  cfg: GameConfig;
  startedAt: number;
  lastMoveAt: number;
  variations: VariationData[];
  /** Set once the player resigns; game-over state derives from this OR chess.js. */
  resigned?: boolean;
}