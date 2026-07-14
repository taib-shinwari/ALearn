// Stockfish.wasm UCI wrapper. Single-threaded build → no SharedArrayBuffer needed.
// Files are served from /public/stockfish/.
// Single persistent worker + serialized request queue so we don't tear down /
// recreate the engine per call (huge perf win for analysis + opponent moves).

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
          // eslint-disable-next-line no-console
          console.info("[sf] ready");
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

export interface SFOptions {
  /** Search depth (used when no movetime). */
  depth?: number;
  /** Hard time cap in ms (overrides depth-only search if set). */
  movetimeMs?: number;
  /** 0..20 — lower = weaker. Mutually exclusive with uciElo. */
  skill?: number;
  /** Use UCI_LimitStrength + UCI_Elo. Stockfish range ≈ 1320–3190. */
  uciElo?: number;
}

// Serialize calls so concurrent requests don't garble UCI state.
let chain: Promise<unknown> = Promise.resolve();

async function runUci(fen: string, opts: SFOptions): Promise<SFEval> {
  const w = await getWorker();
  return new Promise<SFEval>((resolve) => {
    let lastCp = 0;
    const onMsg = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info ")) {
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
    // Apply strength options.
    if (typeof opts.uciElo === "number") {
      w.postMessage("setoption name UCI_LimitStrength value true");
      const elo = Math.max(1320, Math.min(3190, Math.round(opts.uciElo)));
      w.postMessage(`setoption name UCI_Elo value ${elo}`);
    } else {
      w.postMessage("setoption name UCI_LimitStrength value false");
    }
    if (typeof opts.skill === "number") {
      const sk = Math.max(0, Math.min(20, Math.round(opts.skill)));
      w.postMessage(`setoption name Skill Level value ${sk}`);
    } else {
      w.postMessage("setoption name Skill Level value 20");
    }
    w.postMessage(`position fen ${fen}`);
    if (opts.movetimeMs && opts.movetimeMs > 0) {
      w.postMessage(`go movetime ${Math.round(opts.movetimeMs)}`);
    } else {
      const d = Math.max(1, Math.min(22, opts.depth ?? 12));
      w.postMessage(`go depth ${d}`);
    }
  });
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  // Keep chain rejection-safe.
  chain = next.catch(() => undefined);
  return next;
}

/** Evaluate a position with full strength. */
export function sfEvaluate(fen: string, depth = 12): Promise<SFEval> {
  return enqueue(() => runUci(fen, { depth }));
}

/** Evaluate / pick a move with strength controls. */
export function sfBestMove(fen: string, opts: SFOptions = {}): Promise<SFEval> {
  return enqueue(() => runUci(fen, opts));
}

export interface SFLine {
  /** centipawn score from side-to-move POV (mate scores clamped to ±100000) */
  scoreCp: number;
  /** principal variation, long algebraic (e.g. ["e2e4", "e7e5", ...]) */
  pv: string[];
}

export interface SFLineOptions {
  depth?: number;
  movetimeMs?: number;
  /** number of candidate lines (MultiPV). Default 3. */
  lines?: number;
}

async function runMultiPv(fen: string, opts: SFLineOptions): Promise<SFLine[]> {
  const w = await getWorker();
  const numLines = Math.max(1, Math.min(8, opts.lines ?? 3));
  return new Promise<SFLine[]>((resolve) => {
    const pvMap = new Map<number, SFLine>();
    const onMsg = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info ")) {
        const mMultipv = line.match(/multipv (\d+)/);
        const idx = mMultipv ? parseInt(mMultipv[1], 10) : 1;
        const mMate = line.match(/score mate (-?\d+)/);
        const mCp = line.match(/score cp (-?\d+)/);
        const mPv = line.match(/ pv (.+)$/);
        if (!mPv) return; // ignore info lines without a pv (e.g. currmove updates)
        let scoreCp = 0;
        if (mMate) {
          const n = parseInt(mMate[1], 10);
          scoreCp = n > 0 ? 100000 - n : -100000 - n;
        } else if (mCp) {
          scoreCp = parseInt(mCp[1], 10);
        }
        pvMap.set(idx, { scoreCp, pv: mPv[1].trim().split(/\s+/) });
      } else if (line.startsWith("bestmove")) {
        w.removeEventListener("message", onMsg);
        // Reset MultiPV so subsequent single-line calls (sfBestMove/sfEvaluate)
        // aren't affected by this search's setting.
        w.postMessage("setoption name MultiPV value 1");
        const result = Array.from(pvMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([, v]) => v);
        resolve(result);
      }
    };
    w.addEventListener("message", onMsg);
    w.postMessage(`setoption name MultiPV value ${numLines}`);
    w.postMessage("setoption name UCI_LimitStrength value false");
    w.postMessage("setoption name Skill Level value 20");
    w.postMessage(`position fen ${fen}`);
    if (opts.movetimeMs && opts.movetimeMs > 0) {
      w.postMessage(`go movetime ${Math.round(opts.movetimeMs)}`);
    } else {
      const d = Math.max(1, Math.min(22, opts.depth ?? 14));
      w.postMessage(`go depth ${d}`);
    }
  });
}

/** Top N candidate lines (principal variations) from a position, via Stockfish MultiPV. */
export function sfBestLine(fen: string, opts: SFLineOptions = {}): Promise<SFLine[]> {
  return enqueue(() => runMultiPv(fen, opts));
}

/** Stop and discard the engine (frees memory). */
export function sfTerminate() {
  if (workerSingleton) {
    try { workerSingleton.postMessage("quit"); } catch { /* */ }
    try { workerSingleton.terminate(); } catch { /* */ }
    workerSingleton = null;
    readyPromise = null;
    chain = Promise.resolve();
  }
}

// Expose tiny ping for manual verification in the browser console.
if (typeof window !== "undefined") {
  (window as unknown as { __sfPing?: () => Promise<SFEval> }).__sfPing =
    () => sfEvaluate("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 6);
}