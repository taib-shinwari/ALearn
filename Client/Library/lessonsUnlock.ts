// Unlock + bypass progress for the lessons system.
// Per language, tracks completed sub-lessons and bypassed (forced-unlocked) ids.

const KEY = "lessons-unlock-v1";

interface Store {
  // lang -> { completed: ["A1/Getting-Started/The-Alphabet/Vowels"], bypassed: [...] }
  [lang: string]: { completed: string[]; bypassed: string[] };
}

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
  listeners.forEach(l => l());
}

const listeners = new Set<() => void>();

export function lessonId(level: string, unit?: string, lesson?: string, sub?: string) {
  return [level, unit, lesson, sub].filter(Boolean).join("/");
}

export function isCompleted(lang: string, id: string): boolean {
  return (read()[lang]?.completed ?? []).includes(id);
}

export function isBypassed(lang: string, id: string): boolean {
  return (read()[lang]?.bypassed ?? []).includes(id);
}

export function isUnlocked(lang: string, id: string, prevId?: string): boolean {
  if (!prevId) return true; // first item always unlocked
  if (isBypassed(lang, id)) return true;
  return isCompleted(lang, prevId);
}

export function markCompleted(lang: string, id: string) {
  const s = read();
  if (!s[lang]) s[lang] = { completed: [], bypassed: [] };
  if (!s[lang].completed.includes(id)) s[lang].completed.push(id);
  write(s);
}

export function bypass(lang: string, id: string) {
  const s = read();
  if (!s[lang]) s[lang] = { completed: [], bypassed: [] };
  if (!s[lang].bypassed.includes(id)) s[lang].bypassed.push(id);
  write(s);
}

export function subscribeUnlock(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** First-visit gate, used by Lessons root to auto-redirect into the first lesson. */
const VISIT_KEY = "lessons-visited-v1";
export function hasVisited(lang: string) {
  try { return (JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[]).includes(lang); }
  catch { return false; }
}
export function markVisited(lang: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[];
    if (!arr.includes(lang)) arr.push(lang);
    localStorage.setItem(VISIT_KEY, JSON.stringify(arr));
  } catch { /* noop */ }
}
