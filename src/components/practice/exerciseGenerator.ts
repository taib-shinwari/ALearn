import { WordDetail, WordLang, getWordText } from "@/data/courseData";

export type ExerciseType =
  | "mc-target-to-ui"
  | "mc-ui-to-target"
  | "type-target"
  | "listen-type"
  | "speak-target";

export interface Exercise {
  type: ExerciseType;
  wordId: string;
  targetText: string;
  answer: string;
  options?: string[];
  correct?: number;
  prompt: string;
}

interface T {
  whatDoes: string;
  typeAnswer: string;
  listenAndType: string;
  selectMeaning: string;
  speakWord: string;
}

const TYPES: ExerciseType[] = [
  "mc-target-to-ui",
  "mc-ui-to-target",
  "type-target",
  "listen-type",
  "speak-target",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickWrongOptions(word: WordDetail, pool: WordDetail[], lang: WordLang, count = 3): string[] {
  return shuffle(pool.filter(w => w.id !== word.id))
    .slice(0, count)
    .map(w => getWordText(w, lang));
}

export function buildExercise(
  word: WordDetail,
  index: number,
  pool: WordDetail[],
  courseLang: WordLang,
  answerLang: WordLang,
  t: T,
): Exercise {
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
    case "type-target":
      return { type, wordId: word.id, targetText, answer: targetText,
        prompt: `${t.typeAnswer}: "${uiText}"` };
    case "listen-type":
      return { type, wordId: word.id, targetText, answer: targetText, prompt: t.listenAndType };
    case "speak-target":
      return { type, wordId: word.id, targetText, answer: targetText,
        prompt: `${t.speakWord}: "${uiText}"` };
  }
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
