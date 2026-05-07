import { useCallback, useEffect, useState } from "react";

const KEY = "markedWords";

type MarkedMap = Record<string, string[]>; // lang -> wordIds

function read(): MarkedMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function write(map: MarkedMap) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* no-op */ }
  window.dispatchEvent(new Event("marked-words-changed"));
}

/** Per-device marked words, keyed by course (target) language. */
export function useMarkedWords() {
  const [map, setMap] = useState<MarkedMap>(() => read());

  useEffect(() => {
    const sync = () => setMap(read());
    window.addEventListener("marked-words-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("marked-words-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isMarked = useCallback(
    (lang: string, id: string) => (map[lang] || []).includes(id),
    [map],
  );

  const toggle = useCallback((lang: string, id: string) => {
    const cur = map[lang] || [];
    const next = cur.includes(id) ? cur.filter(w => w !== id) : [...cur, id];
    const updated = { ...map, [lang]: next };
    write(updated);
    setMap(updated);
  }, [map]);

  return { map, isMarked, toggle };
}
