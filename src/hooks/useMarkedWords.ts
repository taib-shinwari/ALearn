import { useEffect, useState, useCallback } from "react";

// localStorage map: { [lang]: string[] }
const KEY = "markedWords.v1";

type Map = Record<string, string[]>;

function read(): Map {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Map; } catch { return {}; }
}
function write(m: Map) {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("markedWords:change"));
}

export function useMarkedWords() {
  const [map, setMap] = useState<Map>(() => read());

  useEffect(() => {
    const h = () => setMap(read());
    window.addEventListener("markedWords:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("markedWords:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const isMarked = useCallback((lang: string, id: string) => (map[lang] || []).includes(id), [map]);
  const toggle = useCallback((lang: string, id: string) => {
    const cur = read();
    const list = cur[lang] || [];
    cur[lang] = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    write(cur);
  }, []);

  return { map, isMarked, toggle };
}
