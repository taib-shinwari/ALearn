// Server/API/Language.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedLang   = "Dutch" | "English" | "Arabic" | "Pashto";
export type I18nLang        = "Dutch" | "English" | "Arabic";
export type SectionType     = "Vocabulary" | "Grammar";

export type WordEntry = Array<string | Record<string, string>>;
export type Labels = Record<string, string>;
export type ArabicAlphabetEntry = [string, string, string, string, string];

export interface ArabicLetterForms {
  name: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

// ─── Build-Time Ingestion (Eager Globbing) ───────────────────────────────────

// Eagerly grab all JSON files across Language and i18n data roots using absolute paths
const allLanguageFiles = import.meta.glob('/Server/Data/Language/**/*.json', { eager: true });
const allI18nFiles     = import.meta.glob('/Server/DataInternationalization/**/*.json', { eager: true });

// Pre-structured data trees to replace runtime disk scanning
const AVAILABLE_LANGS = new Set<SupportedLang>();
const VOCAB_GRAMMAR_DATA: Record<string, Record<string, Record<string, Record<string, WordEntry>>>> = {};
const ARABIC_ALPHABET: Record<string, ArabicAlphabetEntry> = {};
const I18N_LABELS: Record<string, Labels> = {};

// 1. Process Language Data files
for (const [filePath, module] of Object.entries(allLanguageFiles)) {
  const data = (module as { default: any }).default;
  
  // Normalize Windows paths and strip off background query hashes (e.g. ?import)
  const cleanPath = filePath.replace(/\\/g, '/').split('?')[0];

  // Pattern A: Alphabet items -> /Server/Data/Language/Arabic/Alphabet/<Index>.json
  if (cleanPath.includes('/Language/Arabic/Alphabet/')) {
    const parts = cleanPath.split('/');
    const index = parts[parts.length - 1].replace(/\.json$/, '');
    ARABIC_ALPHABET[index] = data as ArabicAlphabetEntry;
    continue;
  }

  // Pattern B: Word files -> /Server/Data/Language/<Lang>/<Section>/<Category>/<Subcategory>/<Word>.json
  if (cleanPath.includes('/Language/')) {
    const afterRoot = cleanPath.split('/Language/')[1];
    const segments = afterRoot.split('/');

    // Requires at least [Lang, Section, Category, Word.json] (4 items)
    if (segments.length >= 4) {
      const lang = segments[0] as SupportedLang;
      const section = segments[1];
      const category = segments[2];
      
      let subcategory = "Default";
      let fileName = segments[3];

      // If it contains 5 items, there is a real subdirectory folder present
      if (segments.length === 5) {
        subcategory = segments[3];
        fileName = segments[4];
      }

      const wordSlug = fileName.replace(/\.json$/, '');
      AVAILABLE_LANGS.add(lang);

      if (!VOCAB_GRAMMAR_DATA[lang]) VOCAB_GRAMMAR_DATA[lang] = {};
      if (!VOCAB_GRAMMAR_DATA[lang][section]) VOCAB_GRAMMAR_DATA[lang][section] = {};
      if (!VOCAB_GRAMMAR_DATA[lang][section][category]) VOCAB_GRAMMAR_DATA[lang][section][category] = {};
      if (!VOCAB_GRAMMAR_DATA[lang][section][category][subcategory]) {
        VOCAB_GRAMMAR_DATA[lang][section][category][subcategory] = {};
      }

      VOCAB_GRAMMAR_DATA[lang][section][category][subcategory][wordSlug] = data as WordEntry;
    }
  }
}

// 2. Process i18n Labels -> /Server/DataInternationalization/<Lang>/labels.json
for (const [filePath, module] of Object.entries(allI18nFiles)) {
  const data = (module as { default: Labels }).default;
  const cleanPath = filePath.replace(/\\/g, '/').split('?')[0];
  
  if (cleanPath.includes('Internationalization/')) {
    const afterRoot = cleanPath.split('Internationalization/')[1];
    const segments = afterRoot.split('/');

    // Expecting: [LanguageName, "labels.json"]
    if (segments.length === 2 && segments[1] === 'labels.json') {
      const lang = segments[0];
      I18N_LABELS[lang] = data;
    }
  }
}

// ─── Public API (In-Memory Accessors) ─────────────────────────────────────────

export function getAvailableLanguages(): SupportedLang[] {
  return Array.from(AVAILABLE_LANGS);
}

export function getCategories(lang: SupportedLang, section: SectionType): string[] {
  return Object.keys(VOCAB_GRAMMAR_DATA[lang]?.[section] ?? {});
}

export function getSubcategories(
  lang: SupportedLang,
  section: SectionType,
  category: string,
): string[] {
  return Object.keys(VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category] ?? {});
}

export function getWordSlugs(
  lang: SupportedLang,
  section: SectionType,
  category: string,
  subcategory: string,
): string[] {
  return Object.keys(VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category]?.[subcategory] ?? {});
}

export function getWord(
  lang: SupportedLang,
  section: SectionType,
  category: string,
  subcategory: string,
  wordSlug: string,
): WordEntry | null {
  return VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category]?.[subcategory]?.[wordSlug] ?? null;
}

export function getWordsInSubcategory(
  lang: SupportedLang,
  section: SectionType,
  category: string,
  subcategory: string,
): Record<string, WordEntry> {
  return VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category]?.[subcategory] ?? {};
}

export function getWordsInCategory(
  lang: SupportedLang,
  section: SectionType,
  category: string,
): Record<string, Record<string, WordEntry>> {
  return VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category] ?? {};
}

export function getAllWords(
  lang: SupportedLang,
): Record<SectionType, Record<string, Record<string, Record<string, WordEntry>>>> {
  return (VOCAB_GRAMMAR_DATA[lang] as any) ?? { Vocabulary: {}, Grammar: {} };
}

// ─── Arabic Alphabet API ─────────────────────────────────────────────────────

export function getArabicLetterRaw(index: string | number): ArabicAlphabetEntry | null {
  return ARABIC_ALPHABET[String(index)] ?? null;
}

export function getArabicLetter(index: string | number): ArabicLetterForms | null {
  const raw = getArabicLetterRaw(index);
  if (!raw) return null;

  const [isolated, initial, medial, final, name] = raw;
  return { name, isolated, initial, medial, final };
}

export function getAllArabicLetters(): ArabicLetterForms[] {
  const sortedIndices = Object.keys(ARABIC_ALPHABET)
    .filter(f => !isNaN(Number(f)))
    .sort((a, b) => Number(a) - Number(b));

  const alphabet: ArabicLetterForms[] = [];
  for (const idx of sortedIndices) {
    const mapped = getArabicLetter(idx);
    if (mapped) alphabet.push(mapped);
  }
  return alphabet;
}

export function findArabicForms(letter: string): ArabicLetterForms | undefined {
  return getAllArabicLetters().find(
    f => f.isolated === letter || f.initial === letter || f.medial === letter || f.final === letter
  );
}

// ─── i18n API ─────────────────────────────────────────────────────────────────

export function getLabels(lang: I18nLang): Labels | null {
  return I18N_LABELS[lang] ?? null;
}

export function getAllLabels(): Partial<Record<I18nLang, Labels>> {
  return I18N_LABELS;
}

export function getLabel(
  lang: I18nLang,
  key: string,
  fallbackLang?: I18nLang,
): string | undefined {
  const labels = getLabels(lang);
  if (labels?.[key] !== undefined) return labels[key];

  if (fallbackLang && fallbackLang !== lang) {
    return getLabels(fallbackLang)?.[key];
  }
  return undefined;
}

export function wordExists(
  lang: SupportedLang,
  section: SectionType,
  category: string,
  subcategory: string,
  wordSlug: string,
): boolean {
  return !!VOCAB_GRAMMAR_DATA[lang]?.[section]?.[category]?.[subcategory]?.[wordSlug];
}