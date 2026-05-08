// Lightweight image lookup using Wikipedia's REST summary endpoint.
// No API key, CORS-enabled. Returns a thumbnail URL or null.

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const wikiLang = (lang: string) => (lang === "nl" ? "nl" : "en");

export function fetchWordImage(word: string, lang: string): Promise<string | null> {
  const key = `${lang}:${word.toLowerCase()}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (inflight.has(key)) return inflight.get(key)!;

  const url = `https://${wikiLang(lang)}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`;
  const p = fetch(url)
    .then(r => (r.ok ? r.json() : null))
    .then((data: any) => {
      const src = data?.thumbnail?.source || data?.originalimage?.source || null;
      cache.set(key, src);
      return src;
    })
    .catch(() => {
      cache.set(key, null);
      return null;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
