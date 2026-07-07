// @/Components/Library/chess.worker.ts
import { findBestMove, pickEngineMove, findThreat, getBestLine } from "./chessEngine";
import { Chess } from "chess.js";

self.onmessage = async (e: MessageEvent) => {
  const { id, type, fen, depth, elo, plies, searchDepth } = e.data;
  
  try {
    const game = new Chess(fen);

    switch (type) {
      case "FIND_BEST_MOVE": {
        const result = findBestMove(game, depth);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "PICK_ENGINE_MOVE": {
        const result = pickEngineMove(game, elo);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "FIND_THREAT": {
        const result = findThreat(game);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "GET_BEST_LINE": {
        const result = getBestLine(game, plies, searchDepth);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      default:
        throw new Error(`Unknown background task action type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({ id, type: "ERROR", error: error.message });
  }
};