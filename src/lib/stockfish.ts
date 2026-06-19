// Stockfish.wasm UCI wrapper. Single-threaded build → no SharedArrayBuffer needed.
// Files are served from /public/stockfish/.

const ENGINE_URL = "/stockfish/stockfish-18-lite-single.js";

let workerSingleton: Worker | null = null;
let readyPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (workerSingleton) return Promise.resolve(workerSingleton);
  if (readyPromise) return readyPromise;
  readyPromise = new Promise<Worker>((resolve, reject) => {
    try {
      const w = new Worker(ENGINE_URL);
      let isReady = false;
      const onMsg = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (!isReady && line === "uciok") {
          w.postMessage("isready");
        } else if (!isReady && line === "readyok") {
          isReady = true;
          w.removeEventListener("message", onMsg);
          workerSingleton = w;
          resolve(w);
        }
      };
      w.addEventListener("message", onMsg);
      w.addEventListener("error", (e) => reject(e));
      w.postMessage("uci");
    } catch (e) {
      reject(e);
    }
  });
  return readyPromise;
}

export interface SFEval {
  /** centipawn score from side-to-move POV (mate scores clamped to ±100000) */
  scoreCp: number;
  bestMove: string | null; // long algebraic, e.g. "e2e4"
}

/** Evaluate a position. Resolves when bestmove is sent. */
export async function sfEvaluate(fen: string, depth = 12): Promise<SFEval> {
  const w = await getWorker();
  return new Promise<SFEval>((resolve) => {
    let lastCp = 0;
    const onMsg = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info ")) {
        // parse score
        const mCp = line.match(/score cp (-?\d+)/);
        const mMate = line.match(/score mate (-?\d+)/);
        if (mMate) {
          const n = parseInt(mMate[1], 10);
          lastCp = n > 0 ? 100000 - n : -100000 - n;
        } else if (mCp) {
          lastCp = parseInt(mCp[1], 10);
        }
      } else if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const best = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
        w.removeEventListener("message", onMsg);
        resolve({ scoreCp: lastCp, bestMove: best });
      }
    };
    w.addEventListener("message", onMsg);
    w.postMessage("ucinewgame");
    w.postMessage(`position fen ${fen}`);
    w.postMessage(`go depth ${depth}`);
  });
}

/** Stop and discard the engine (frees memory). */
export function sfTerminate() {
  if (workerSingleton) {
    try { workerSingleton.postMessage("quit"); } catch { /* */ }
    try { workerSingleton.terminate(); } catch { /* */ }
    workerSingleton = null;
    readyPromise = null;
  }
}
