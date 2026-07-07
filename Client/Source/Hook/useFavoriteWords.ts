import { useEffect, useState, useCallback } from "react";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type SupportedLang = "Dutch" | "English" | "Arabic" | "Pashto";

const KEY = "favoriteWords.v1";

type FavoriteMap = Record<string, string[]>;

function read(): FavoriteMap {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as FavoriteMap; } catch { return {}; }
}
function write(m: FavoriteMap) {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("favoriteWords:change"));
}

export function useFavoriteWords() {
  const [map, setMap] = useState<FavoriteMap>(() => read());

  useEffect(() => {
    const h = () => setMap(read());
    window.addEventListener("favoriteWords:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("favoriteWords:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const isFavorite = useCallback(
    (lang: SupportedLang, id: string) => (map[lang] || []).includes(id),
    [map],
  );

  const toggle = useCallback((lang: SupportedLang, id: string) => {
    const cur  = read();
    const list = cur[lang] || [];
    cur[lang]  = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    write(cur);
  }, []);

  return { map, isFavorite, toggle };
}