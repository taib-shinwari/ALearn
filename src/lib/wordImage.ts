// Real photo lookup for vocabulary words.
//
// Strategy: query Wikipedia's `opensearch` to disambiguate the word into the
// most relevant article, then pull the page's lead thumbnail from the REST
// summary endpoint. If the target-language wiki has no result, fall back to
// the English wiki. This avoids returning bad/illustrated images for ambiguous
// short words like "Apple" or "Hond". No AI-generated imagery — every image
// here is a real photograph or diagram sourced from Wikimedia.

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const wikiLang = (lang: string) => (lang === "nl" ? "nl" : lang === "ar" ? "ar" : "en");

async function resolveTitle(query: string, lang: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&origin=*&search=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const titles: string[] = data?.[1] || [];
    return titles[0] || null;
  } catch {
    return null;
  }
}

async function thumbnailFor(title: string, lang: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const data: any = await r.json();
    // Skip disambiguation pages — they rarely have a meaningful image.
    if (data?.type === "disambiguation") return null;
    return data?.thumbnail?.source || data?.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function lookup(word: string, lang: string): Promise<string | null> {
  const langs = Array.from(new Set([wikiLang(lang), "en"]));
  for (const l of langs) {
    const title = await resolveTitle(word, l);
    if (!title) continue;
    const src = await thumbnailFor(title, l);
    if (src) return src;
  }
  return null;
}

export function fetchWordImage(word: string, lang: string): Promise<string | null> {
  const key = `${lang}:${word.toLowerCase()}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (inflight.has(key)) return inflight.get(key)!;

  const p = lookup(word, lang)
    .then(src => { cache.set(key, src); return src; })
    .catch(() => { cache.set(key, null); return null; })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
