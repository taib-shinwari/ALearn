import { useEffect, useState, useCallback } from "react";
import type { SupportedLang } from "Server/API/Language";

/**
 * WordDetail mirrors the shape expected by WordDetailView.
 * Define it here since it's no longer exported from courseData.
 */
export interface WordLangData {
  word: string;
  pronunciation?: string;
  definition?: string;
  plural?: string;
  diminutive?: string;
  conjugation?: Record<string, string>;
  example?: string;
  // Dutch-specific
  definitie?: string;
  meervoud?: string;
  verkleinwoord?: string;
  vervoeging?: Record<string, string>;
  voorbeeld?: string;
  gender?: "m" | "f" | "n" | "c";
}

export interface WordDetail {
  id: string;
  nl: WordLangData;
  en: WordLangData;
  ar?: WordLangData;
}

const CUSTOM_KEY   = "customWords.v1";    // { [catId/subId]: WordDetail[] }
const OVERRIDE_KEY = "wordOverrides.v1";  // { [wordId]: Partial<WordDetail> }

type CustomMap   = Record<string, WordDetail[]>;
type OverrideMap = Record<string, Partial<WordDetail>>;

const readJSON = <T,>(k: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? fallback; } catch { return fallback; }
};
const writeJSON = (k: string, v: unknown, evt: string) => {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(evt));
};

function subKey(catId: string, subId: string) { return `${catId}/${subId}`; }

export function useCustomWords(categoryId?: string, subcategoryId?: string) {
  const [allCustom, setAllCustom] = useState<CustomMap>  (() => readJSON(CUSTOM_KEY,   {}));
  const [overrides, setOverrides] = useState<OverrideMap>(() => readJSON(OVERRIDE_KEY, {}));

  useEffect(() => {
    const h1 = () => setAllCustom(readJSON(CUSTOM_KEY,   {}));
    const h2 = () => setOverrides(readJSON(OVERRIDE_KEY, {}));
    window.addEventListener("customWords:change",   h1);
    window.addEventListener("wordOverrides:change", h2);
    return () => {
      window.removeEventListener("customWords:change",   h1);
      window.removeEventListener("wordOverrides:change", h2);
    };
  }, []);

  const customWords = categoryId && subcategoryId
    ? (allCustom[subKey(categoryId, subcategoryId)] || [])
    : [];

  const addCustomWord = useCallback((w: WordDetail) => {
    if (!categoryId || !subcategoryId) return;
    const cur = readJSON<CustomMap>(CUSTOM_KEY, {});
    const k   = subKey(categoryId, subcategoryId);
    cur[k]    = [...(cur[k] || []), w];
    writeJSON(CUSTOM_KEY, cur, "customWords:change");
  }, [categoryId, subcategoryId]);

  const removeCustomWord = useCallback((wordId: string) => {
    if (!categoryId || !subcategoryId) return;
    const cur = readJSON<CustomMap>(CUSTOM_KEY, {});
    const k   = subKey(categoryId, subcategoryId);
    cur[k]    = (cur[k] || []).filter(w => w.id !== wordId);
    writeJSON(CUSTOM_KEY, cur, "customWords:change");
  }, [categoryId, subcategoryId]);

  const updateCustomWord = useCallback((wordId: string, patch: Partial<WordDetail>) => {
    if (!categoryId || !subcategoryId) return;
    const cur = readJSON<CustomMap>(CUSTOM_KEY, {});
    const k   = subKey(categoryId, subcategoryId);
    cur[k]    = (cur[k] || []).map(w => w.id === wordId ? { ...w, ...patch } : w);
    writeJSON(CUSTOM_KEY, cur, "customWords:change");
  }, [categoryId, subcategoryId]);

  const setOverride = useCallback((wordId: string, patch: Partial<WordDetail>) => {
    const cur    = readJSON<OverrideMap>(OVERRIDE_KEY, {});
    cur[wordId]  = { ...(cur[wordId] || {}), ...patch };
    writeJSON(OVERRIDE_KEY, cur, "wordOverrides:change");
  }, []);

  const getOverride = useCallback(
    (wordId: string) => overrides[wordId] || null,
    [overrides],
  );

  const applyOverride = useCallback((w: WordDetail): WordDetail => {
    const o = overrides[w.id];
    if (!o) return w;
    return {
      ...w,
      ...o,
      nl: { ...w.nl, ...(o.nl || {}) },
      en: { ...w.en, ...(o.en || {}) },
      ar: o.ar ? { ...(w.ar || { word: "" }), ...o.ar } : w.ar,
    };
  }, [overrides]);

  const isCustom = useCallback(
    (id: string) => customWords.some(w => w.id === id),
    [customWords],
  );

  return {
    customWords, addCustomWord, removeCustomWord, updateCustomWord,
    setOverride, getOverride, applyOverride, isCustom,
  };
}