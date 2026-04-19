import { WordDetail, WordLang, getWordText } from "@/data/courseData";

export type ExerciseType = "mc-target-to-ui" | "mc-ui-to-target" | "type-target" | "listen-type";

export interface Exercise {
  type: ExerciseType;
  wordId: string;
  // The word's text in the target (course) language — always available.
  targetText: string;
  // The expected answer (depends on exercise type).
  answer: string;
  // Multiple-choice options (only for MC exercises).
  options?: string[];
  // Index of correct option (only for MC exercises).
  correct?: number;
  // The prompt label (translated, e.g. 'What does "hallo" mean?').
  prompt: string;
}

interface T {
  whatDoes: string;
  typeAnswer: string;
  listenAndType: string;
  selectMeaning: string;
}

const TYPES: ExerciseType[] = ["mc-target-to-ui", "mc-ui-to-target", "type-target", "listen-type"];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickWrongOptions(
  word: WordDetail,
  pool: WordDetail[],
  lang: WordLang,
  count = 3,
): string[] {
  return shuffle(pool.filter(w => w.id !== word.id))
    .slice(0, count)
    .map(w => getWordText(w, lang));
}

/**
 * Build a varied exercise for a given word. The exercise type is rotated so
 * each session mixes multiple-choice (both directions), typing, and listening.
 */
export function buildExercise(
  word: WordDetail,
  index: number,
  pool: WordDetail[],
  courseLang: WordLang,
  answerLang: WordLang,
  t: T,
): Exercise {
  // Rotate type by index so the user always sees a mix.
  // Skip listen-type when SpeechSynthesis isn't available — handled at runtime.
  const type = TYPES[index % TYPES.length];
  const targetText = getWordText(word, courseLang);
  const uiText = getWordText(word, answerLang);

  switch (type) {
    case "mc-target-to-ui": {
      const wrong = pickWrongOptions(word, pool, answerLang);
      const options = shuffle([...wrong, uiText]);
      return {
        type, wordId: word.id, targetText, answer: uiText, options,
        correct: options.indexOf(uiText),
        prompt: `${t.whatDoes} "${targetText}"?`,
      };
    }
    case "mc-ui-to-target": {
      const wrong = pickWrongOptions(word, pool, courseLang);
      const options = shuffle([...wrong, targetText]);
      return {
        type, wordId: word.id, targetText, answer: targetText, options,
        correct: options.indexOf(targetText),
        prompt: `${t.selectMeaning}: "${uiText}"`,
      };
    }
    case "type-target": {
      return {
        type, wordId: word.id, targetText, answer: targetText,
        prompt: `${t.typeAnswer}: "${uiText}"`,
      };
    }
    case "listen-type": {
      return {
        type, wordId: word.id, targetText, answer: targetText,
        prompt: t.listenAndType,
      };
    }
  }
}

/** Normalize an answer for comparison: trim, lowercase, strip articles. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^(de|het|the|a|an|een)\s+/i, "")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(user: string, expected: string): boolean {
  return normalizeAnswer(user) === normalizeAnswer(expected);
}
