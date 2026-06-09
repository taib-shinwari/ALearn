// Real photo lookup for vocabulary words.
//
// Disambiguation strategy:
//   1. If an English word + definition is supplied, search the EN wiki using
//      "<word> <first noun-ish phrase from definition>" — this picks the right
//      article for ambiguous short words like "Apple" or "Bat".
//   2. Fallback: plain word search on the target-language wiki, then EN.
//
// Returns a Wikipedia/Wikimedia thumbnail URL, or null.

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const wikiLang = (lang: string) => (lang === "nl" ? "nl" : lang === "ar" ? "ar" : "en");

async function resolveTitle(query: string, lang: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&origin=*&search=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return (data?.[1] || [])[0] || null;
  } catch { return null; }
}

async function thumbnailFor(title: string, lang: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data: any = await r.json();
    if (data?.type === "disambiguation") return null;
    return data?.thumbnail?.source || data?.originalimage?.source || null;
  } catch { return null; }
}

/** Pick the first ~6 meaningful words from a definition to use as a disambiguating hint. */
function definitionHint(def?: string): string {
  if (!def) return "";
  // Strip leading "A ", "An ", "The " and grab first phrase up to , ; . (
  const cleaned = def.replace(/^(a|an|the)\s+/i, "").split(/[,.;(]/)[0].trim();
  return cleaned.split(/\s+/).slice(0, 6).join(" ");
}

export interface WordImageOpts {
  /** The display word in the target language (may be Dutch/Arabic). */
  word: string;
  /** Target language used as the primary wiki to search. */
  lang: string;
  /** English form of the word — used together with definition on EN wiki for disambiguation. */
  enWord?: string;
  /** English definition — used to disambiguate "Apple (fruit)" vs "Apple Inc". */
  enDefinition?: string;
}

async function lookup(opts: WordImageOpts): Promise<string | null> {
  const { word, lang, enWord, enDefinition } = opts;
  const hint = definitionHint(enDefinition);
  const candidates: Array<{ q: string; lang: string }> = [];

  // 1. EN wiki with word + definition hint (highest signal)
  if (enWord && hint) candidates.push({ q: `${enWord} ${hint}`, lang: "en" });
  // 2. Target-language wiki with just the word
  candidates.push({ q: word, lang: wikiLang(lang) });
  // 3. EN wiki with just the English word
  if (enWord) candidates.push({ q: enWord, lang: "en" });
  // 4. EN wiki with the localized word as a final fallback
  candidates.push({ q: word, lang: "en" });

  for (const c of candidates) {
    const title = await resolveTitle(c.q, c.lang);
    if (!title) continue;
    const src = await thumbnailFor(title, c.lang);
    if (src) return src;
  }
  return null;
}

export function fetchWordImage(opts: WordImageOpts | string, langArg?: string): Promise<string | null> {
  // Back-compat: allow (word, lang) signature.
  const o: WordImageOpts = typeof opts === "string" ? { word: opts, lang: langArg || "en" } : opts;
  const key = `${o.lang}:${o.word.toLowerCase()}:${(o.enWord || "").toLowerCase()}:${(o.enDefinition || "").toLowerCase().slice(0, 40)}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (inflight.has(key)) return inflight.get(key)!;

  const p = lookup(o)
    .then(src => { cache.set(key, src); return src; })
    .catch(() => { cache.set(key, null); return null; })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
