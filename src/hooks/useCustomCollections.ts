// User-authored collections (subcategories) per built-in category, in localStorage.
import { useCallback, useEffect, useState } from "react";
import type { Subcategory } from "@/data/courseData";

const KEY = "customCollections.v1"; // { [categoryId]: Subcategory[] }

type Map = Record<string, Subcategory[]>;

const read = (): Map => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch { return {}; }
};
const write = (m: Map) => {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("customCollections:change"));
};

function makeId(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `col-${Date.now()}`;
}

export function useCustomCollections(categoryId?: string) {
  const [all, setAll] = useState<Map>(read);
  useEffect(() => {
    const h = () => setAll(read());
    window.addEventListener("customCollections:change", h);
    return () => window.removeEventListener("customCollections:change", h);
  }, []);

  const collections = categoryId ? (all[categoryId] || []) : [];

  const addCollection = useCallback((catId: string, name: string) => {
    if (!name.trim()) return;
    const cur = read();
    const id = `c-${makeId(name)}-${Date.now().toString(36)}`;
    const sub: Subcategory = {
      id,
      name: { nl: name, en: name, ar: name },
      words: [],
    };
    cur[catId] = [...(cur[catId] || []), sub];
    write(cur);
  }, []);

  const removeCollection = useCallback((catId: string, subId: string) => {
    const cur = read();
    cur[catId] = (cur[catId] || []).filter(s => s.id !== subId);
    write(cur);
  }, []);

  return { collections, addCollection, removeCollection };
}
