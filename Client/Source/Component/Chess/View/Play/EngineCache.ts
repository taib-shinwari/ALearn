// Tiny single-slot caches keyed by FEN so expensive engine calls don't
// re-run on every render (e.g. clock ticks).
import type { findBestMove, findThreat } from "@/Library/chessEngine";

class FenCache<T> {
  private key: string | null = null;
  private val: T | null = null;
  get(k: string): T | null { return this.key === k ? this.val : null; }
  set(k: string, v: T): T { this.key = k; this.val = v; return v; }
}

export const evalCache = new FenCache<number>();
export const bestCache = new FenCache<ReturnType<typeof findBestMove>["move"]>();
export const threatCache = new FenCache<ReturnType<typeof findThreat>>();

export const ENGINE_REPLY_DELAY_MS = 50;