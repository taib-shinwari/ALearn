// Helpers for the slug-less in-app browser.
// browsePath segments drive what the root "/" page renders.
//
// Layout:
//   []                                           → root, shows "Language" folder
//   ["language"]                                 → list of target languages
//   ["language", "<lang>"]                       → language home (alphabet, call, categories)
//   ["language", "<lang>", "@alphabet"]          → alphabet table
//   ["language", "<lang>", "<cat>"]              → subcategories
//   ["language", "<lang>", "<cat>", "<sub>"]     → words
//   ["language", "<lang>", "<cat>", "<sub>", "<word>"] → word detail

export const ALPHABET_SEGMENT = "@alphabet";

/**
 * Convert a legacy slug path like `/language/cat/sub/word` into our internal
 * browsePath, injecting the active target language at index 1.
 */
export function pathToBrowse(path: string, targetLang: string): string[] {
  const segs = path.split("/").filter(Boolean);
  if (segs[0] === "language" && segs.length >= 2 && segs[1] !== targetLang) {
    return ["language", targetLang, ...segs.slice(1)];
  }
  return segs;
}
