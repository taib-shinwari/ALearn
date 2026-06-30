import { resolveLanguagePath, type SupportedLang } from "Server/API/Language";

// Helpers for the in-app browser.
// browsePath still drives the views internally, but every browse state now has
// a stable slug URL, e.g. /Language/English/Dictionary/Vocabulary/Noun/Greeting.

export const ALPHABET_SEGMENT = "@alphabet";

export const LANG_CODE_TO_NAME: Record<string, SupportedLang> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto",
};

export const LANG_NAME_TO_CODE: Record<string, string> = {
  dutch: "nl",
  nederlands: "nl",
  nl: "nl",
  english: "en",
  en: "en",
  arabic: "ar",
  العربية: "ar",
  ar: "ar",
  pashto: "ps",
  ps: "ps",
};

function enc(segment: string) {
  return encodeURIComponent(segment);
}

function dec(segment: string) {
  try { return decodeURIComponent(segment); }
  catch { return segment; }
}

function normalizeChessSegment(segment: string) {
  return dec(segment).replace(/^The-/i, "").toLowerCase();
}

function toTitleSlug(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

const LESSON_SECTION_TO_SLUG: Record<string, string> = {
  "sec-0": "Beginner",
  "sec-1": "Intermediate",
  "sec-2": "Advanced",
};

const LESSON_SLUG_TO_SECTION: Record<string, string> = {
  beginner: "sec-0",
  intermediate: "sec-1",
  advanced: "sec-2",
  "sec-0": "sec-0",
  "sec-1": "sec-1",
  "sec-2": "sec-2",
};

function sectionToUrlSegment(section?: string) {
  if (!section) return undefined;
  return enc(LESSON_SECTION_TO_SLUG[section] ?? toTitleSlug(section));
}

function sectionFromUrlSegment(section?: string) {
  if (!section) return undefined;
  return LESSON_SLUG_TO_SECTION[section.toLowerCase()] ?? section;
}

function languageCodeFromSlug(slug: string) {
  return LANG_NAME_TO_CODE[dec(slug).toLowerCase()] ?? dec(slug).toLowerCase();
}

function languageNameFromCodeOrName(value: string): SupportedLang {
  const raw = dec(value);
  const code = LANG_NAME_TO_CODE[raw.toLowerCase()] ?? raw.toLowerCase();
  return LANG_CODE_TO_NAME[code] ?? "English";
}

function lessonFolderToSegments(folderId?: string) {
  if (!folderId) return [];
  return folderId.split(":").map(enc);
}

function lessonUnitToSegment(unitId?: string) {
  if (!unitId) return [];
  const parts = unitId.split(":");
  return [enc(parts[2] ?? unitId)];
}

function languageContentSegments(path: string[]) {
  // Internal browsePath uses a synthetic Default subcategory for word files that
  // live directly under a category. Keep the public URL slug clean:
  // /Language/English/Dictionary/Vocabulary/Noun/Hello
  if (path.length >= 3 && path[1] === "Default") return [path[0], ...path.slice(2)];
  return path;
}

export function browsePathToUrl(path: string[]): string {
  if (path.length === 0) return "/";

  if (path[0] === "language") {
    if (path.length === 1) return "/Language";

    const langName = languageNameFromCodeOrName(path[1]);
    const base = `/Language/${enc(langName)}`;
    const branch = path[2];

    if (!branch) return base;
    if (branch === ALPHABET_SEGMENT) return `${base}/Alphabet`;

    if (branch === "dictionary") {
      // ["language", code, "dictionary"]                          → /Dictionary
      // ["language", code, "dictionary", "vocabulary", ...rest]   → /Dictionary/Vocabulary/rest
      if (path.length === 3) return `${base}/Dictionary`;
      const sub = path[3];
      const rest = path.slice(4);
      const subSeg = sub === "vocabulary" ? "Vocabulary" : sub === "grammar" ? "Grammar" : toTitleSlug(sub);
      return [`${base}/Dictionary`, subSeg, ...languageContentSegments(rest).map(enc)]
        .filter(Boolean)
        .join("/");
    }

    if (branch === "lessons") {
      // ["language", code, "lessons", level?, unit?, lesson?, sub?]
      const rest = path.slice(3).map(enc);
      return [`${base}/Lessons`, ...rest].filter(Boolean).join("/");
    }
    if (branch === "_marked") {
      return `${base}/Dictionary/Vocabulary/${languageContentSegments(path.slice(3)).map(enc).join("/")}`;
    }

    return `${base}/${path.slice(2).map(enc).join("/")}`;
  }

  if (path[0] === "chess") {
    if (path.length === 1) return "/Chess";
    const [mode, level, group, lessonOrPuzzle] = path.slice(1);
    if (mode === "lesson") {
      return ["/Chess/Lesson", level && toTitleSlug(level), group && toTitleSlug(group), lessonOrPuzzle && `The-${toTitleSlug(lessonOrPuzzle)}`]
        .filter(Boolean)
        .join("/");
    }
    if (mode === "puzzle") return `/Chess/Puzzle${level ? `/${enc(level)}` : ""}`;
    if (mode === "play") return "/Chess/Play";
    return `/Chess/${path.slice(1).map(enc).join("/")}`;
  }

  return "/";
}

export function urlToBrowsePath(pathname: string): string[] | null {
  const segs = pathname.split("/").filter(Boolean).map(dec);
  if (segs.length === 0) return [];

  const root = segs[0].toLowerCase();

  if (root === "language") {
    if (segs.length === 1) return ["language"];

    const langCode = languageCodeFromSlug(segs[1]);
    const langName = LANG_CODE_TO_NAME[langCode] ?? "English";
    const rest = segs.slice(2);
    if (rest.length === 0) return ["language", langCode];

    const branch = rest[0].toLowerCase();
    if (branch === "alphabet" || rest[0] === ALPHABET_SEGMENT) return ["language", langCode, ALPHABET_SEGMENT];
    if (branch === "lesson" || branch === "lessons") {
      const lessonSegs = rest.slice(1);
      return ["language", langCode, "lessons", ...lessonSegs];
    }

    if (branch === "dictionary") {
      const dictRest = rest.slice(1);
      if (dictRest.length === 0) return ["language", langCode, "dictionary"];

      const subSeg = dictRest[0].toLowerCase();
      const subKey = subSeg === "grammar" ? "grammar" : "vocabulary";
      const contentSegs = dictRest.slice(1);
      if (contentSegs.length === 0) return ["language", langCode, "dictionary", subKey];

      // Resolve content path via the language registry
      const resolved = resolveLanguagePath(langName, contentSegs);
      if (resolved?.kind === "category")
        return ["language", langCode, "dictionary", subKey, resolved.category];
      if (resolved?.kind === "subcategory")
        return ["language", langCode, "dictionary", subKey, resolved.category, resolved.subcategory];
      if (resolved?.kind === "word")
        return ["language", langCode, "dictionary", subKey, resolved.category, resolved.subcategory, resolved.word];

      return ["language", langCode, "dictionary", subKey, ...contentSegs];
    }

    return ["language", langCode, ...rest];
  }

  if (root === "chess") {
    const rest = segs.slice(1);
    if (rest.length === 0) return ["chess"];
    const mode = rest[0].toLowerCase();
    if (mode === "lesson" || mode === "lessons") return ["chess", "lesson", ...rest.slice(1).map(normalizeChessSegment)];
    if (mode === "puzzle" || mode === "puzzles") return ["chess", "puzzle", ...rest.slice(1)];
    if (mode === "play") return ["chess", "play"];
    return ["chess", ...rest.map(s => s.toLowerCase())];
  }

  return null;
}

export function sameBrowsePath(a: string[], b: string[]) {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

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
