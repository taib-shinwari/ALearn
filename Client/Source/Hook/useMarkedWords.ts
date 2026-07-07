import { useEffect, useState, useCallback } from "react";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";

const KEY = "markedWords.v1";

type MarkedMap = Record<string, string[]>;

function read(): MarkedMap {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as MarkedMap; } catch { return {}; }
}
function write(m: MarkedMap) {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("markedWords:change"));
}

export function useMarkedWords() {
  const [map, setMap] = useState<MarkedMap>(() => read());

  useEffect(() => {
    const h = () => setMap(read());
    window.addEventListener("markedWords:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("markedWords:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const isMarked = useCallback(
    (lang: SupportedLang, id: string) => (map[lang] || []).includes(id),
    [map],
  );

  const toggle = useCallback((lang: SupportedLang, id: string) => {
    const cur  = read();
    const list = cur[lang] || [];
    cur[lang]  = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    write(cur);
  }, []);

  return { map, isMarked, toggle };
}