// Client/Components/Library/useChessWorker.ts
import { useEffect, useRef } from "react";
import type { EngineMove } from "./chessEngine";

export function useChessWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolversRef = useRef<Map<string, (value: any) => void>>(new Map());

  useEffect(() => {
    // Instantiate background thread instance utilizing standard asset URLs
    workerRef.current = new Worker(
      new URL("./chess.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { id, type, data, error } = e.data;
      const resolve = resolversRef.current.get(id);
      
      if (resolve) {
        resolversRef.current.delete(id);
        if (type === "SUCCESS") {
          resolve(data);
        } else {
          console.error("Chess Engine Worker Error:", error);
          resolve(null);
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runTask = (type: string, payload: any): Promise<any> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(null);
        return;
      }
      const id = crypto.randomUUID();
      resolversRef.current.set(id, resolve);
      workerRef.current.postMessage({ id, type, ...payload });
    });
  };

  return {
    findBestMove: (fen: string, depth?: number): Promise<{ move: EngineMove | null; score: number }> =>
      runTask("FIND_BEST_MOVE", { fen, depth }),
      
    pickEngineMove: (fen: string, elo: number): Promise<EngineMove | null> =>
      runTask("PICK_ENGINE_MOVE", { fen, elo }),
      
    findThreat: (fen: string): Promise<EngineMove | null> =>
      runTask("FIND_THREAT", { fen }),
      
    getBestLine: (fen: string, plies?: number, searchDepth?: number): Promise<EngineMove[]> =>
      runTask("GET_BEST_LINE", { fen, plies, searchDepth }),
  };
}