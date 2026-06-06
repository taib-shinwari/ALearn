// Persisted user preferences for the Chess module.
import { useEffect, useState } from "react";

export interface ChessSettings {
  allowPremove: boolean;
  animatePieces: boolean;
  animationSpeed: number; // ms
  showHints: boolean;
  speakNarration: boolean;
}

const DEFAULTS: ChessSettings = {
  allowPremove: false,
  animatePieces: true,
  animationSpeed: 220,
  showHints: true,
  speakNarration: true,
};

const KEY = "chess-settings-v1";

function read(): ChessSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ChessSettings>) };
  } catch {
    return DEFAULTS;
  }
}

const listeners = new Set<() => void>();

export function getChessSettings(): ChessSettings {
  return read();
}

export function setChessSettings(patch: Partial<ChessSettings>) {
  const next = { ...read(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
  listeners.forEach(l => l());
}

export function useChessSettings(): [ChessSettings, (p: Partial<ChessSettings>) => void] {
  const [state, setState] = useState<ChessSettings>(read);
  useEffect(() => {
    const cb = () => setState(read());
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return [state, setChessSettings];
}
