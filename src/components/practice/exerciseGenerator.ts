import { WordDetail, WordLang, getWordText } from "@/data/courseData";
import { pickExerciseType, TypeStats } from "@/lib/adaptiveEngine";

export type ExerciseType =
  | "mc-target-to-ui"
  | "mc-ui-to-target"
  | "type-target"
  | "listen-type"
  | "speak-target"
  | "tap-tiles"
  | "dictation"
  | "match-pairs";

export interface Exercise {
  type: ExerciseType;
  wordId: string;
  /** Word ids included in this exercise — same as [wordId] except for match-pairs. */
  wordIds: string[];
  targetText: string;
  answer: string;
  options?: string[];
  correct?: number;
  prompt: string;
  /** For tap-tiles / dictation: tokenized expected sentence. */
  tokens?: string[];
  /** For match-pairs: array of {target, translation, wordId}. */
  pairs?: { target: string; translation: string; wordId: string }[];
}

export interface ExerciseLabels {
  whatDoes: string;
  typeAnswer: string;
  listenAndType: string;
  selectMeaning: string;
  speakWord: string;
  buildSentence: string;
  dictation: string;
  matchPairs: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWrongOptions(word: WordDetail, pool: WordDetail[], lang: WordLang, count = 3): string[] {
  return shuffle(pool.filter(w => w.id !== word.id))
    .slice(0, count)
    .map(w => getWordText(w, lang));
}

/** Example sentence in target language, if available. */
function exampleSentence(word: WordDetail, lang: WordLang): string | undefined {
  if (lang === "nl") return word.nl.voorbeeld;
  if (lang === "ar") return word.ar?.example;
  return word.en.example;
}

function tokenize(s: string): string[] {
  return s.split(/(\s+)/).map(t => t.trim()).filter(Boolean);
}

/** Decide which exercise types are even possible for this word. */
function availableTypes(word: WordDetail, courseLang: WordLang, sttAvailable: boolean): ExerciseType[] {
  const types: ExerciseType[] = ["mc-target-to-ui", "mc-ui-to-target", "type-target", "listen-type"];
  if (sttAvailable) types.push("speak-target");
  const ex = exampleSentence(word, courseLang);
  if (ex && tokenize(ex).length >= 2 && tokenize(ex).length <= 10) {
    types.push("tap-tiles", "dictation");
  }
  return types;
}

export function buildExercise(
  word: WordDetail,
  _index: number,
  pool: WordDetail[],
  courseLang: WordLang,
  answerLang: WordLang,
  t: ExerciseLabels,
  typeStats: TypeStats = {},
  sttAvailable = true,
): Exercise {
  const available = availableTypes(word, courseLang, sttAvailable);
  const type = pickExerciseType(typeStats, available);
  const targetText = getWordText(word, courseLang);
  const uiText = getWordText(word, answerLang);
  const base = { wordId: word.id, wordIds: [word.id], targetText };

  switch (type) {
    case "mc-target-to-ui": {
      const options = shuffle([...pickWrongOptions(word, pool, answerLang), uiText]);
      return { ...base, type, answer: uiText, options, correct: options.indexOf(uiText),
        prompt: `${t.whatDoes} "${targetText}"?` };
    }
    case "mc-ui-to-target": {
      const options = shuffle([...pickWrongOptions(word, pool, courseLang), targetText]);
      return { ...base, type, answer: targetText, options, correct: options.indexOf(targetText),
        prompt: `${t.selectMeaning}: "${uiText}"` };
    }
    case "type-target":
      return { ...base, type, answer: targetText, prompt: `${t.typeAnswer}: "${uiText}"` };
    case "listen-type":
      return { ...base, type, answer: targetText, prompt: t.listenAndType };
    case "speak-target":
      return { ...base, type, answer: targetText, prompt: `${t.speakWord}: "${uiText}"` };
    case "tap-tiles": {
      const sentence = exampleSentence(word, courseLang)!;
      const tokens = tokenize(sentence);
      // Add 2–3 distractor tiles drawn from other words' tokens
      const distractorPool = pool
        .filter(w => w.id !== word.id)
        .flatMap(w => tokenize(exampleSentence(w, courseLang) ?? getWordText(w, courseLang)))
        .filter(tok => tok.length > 1 && !tokens.includes(tok));
      const distractors = shuffle(distractorPool).slice(0, Math.min(3, Math.max(2, Math.floor(tokens.length / 2))));
      const options = shuffle([...tokens, ...distractors]);
      return { ...base, type, answer: sentence, options, tokens,
        prompt: `${t.buildSentence}: "${uiText}"` };
    }
    case "dictation": {
      const sentence = exampleSentence(word, courseLang)!;
      return { ...base, type, answer: sentence, prompt: t.dictation };
    }
    case "match-pairs": {
      // Caller should prefer batchMatchPairs(); keep a single-word fallback.
      return { ...base, type, answer: targetText, prompt: t.matchPairs,
        pairs: [{ target: targetText, translation: uiText, wordId: word.id }] };
    }
  }
}

/**
 * Build a single "match pairs" exercise from up to 4 words. Reduces the
 * caller's queue by 3 (one Exercise replaces 4 cards).
 */
export function buildMatchPairs(
  words: WordDetail[],
  courseLang: WordLang,
  answerLang: WordLang,
  t: ExerciseLabels,
): Exercise | null {
  const picks = words.slice(0, 4);
  if (picks.length < 2) return null;
  const pairs = picks.map(w => ({
    target: getWordText(w, courseLang),
    translation: getWordText(w, answerLang),
    wordId: w.id,
  }));
  return {
    type: "match-pairs",
    wordId: picks[0].id,
    wordIds: picks.map(w => w.id),
    targetText: pairs[0].target,
    answer: "",
    pairs,
    prompt: t.matchPairs,
  };
}

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase()
    .replace(/^(de|het|the|a|an|een)\s+/i, "")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(user: string, expected: string): boolean {
  return normalizeAnswer(user) === normalizeAnswer(expected);
}
