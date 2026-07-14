/**
 * Localized Type Boundaries to eliminate backend build leakage.
 * Replicates the base tuple pattern used across raw language lesson arrays.
 */
export type LessonStep = [string, ...any[]];

export interface ObjectiveStep {
  kind: "objective";
  title: string;
  points: string[];
}

export interface ExplanationStep {
  kind: "explanation";
  body: string;
}

// Both the inline mini-check after an Explanation and the Practice-section
// multiple choice items share this exact shape — no need for a separate
// "check" kind, the dispatcher/component are identical either way.
export interface MultipleChoiceStep {
  kind: "multipleChoice";
  prompt: string;
  options: string[];
  answer: number;
}

export interface DidYouKnowStep {
  kind: "didYouKnow";
  fact: string;
}

export interface VocabEntry {
  letter: string;
  ipa: string;
  uppercase: string;
  lowercase: string;
}

export interface VocabStep {
  kind: "vocab";
  entries: VocabEntry[];
}

export interface MatchPairsActivity {
  kind: "matchPairs";
  items: Array<{ prompt: string; pairs: [string, string][] }>;
}

export interface MultipleChoiceActivity {
  kind: "multipleChoice";
  items: Array<{ prompt: string; options: string[]; answer: number }>;
}

export interface TypeAnswerActivity {
  kind: "typeAnswer";
  items: Array<{ prompt: string; answer: string }>;
}

export interface OrderSentenceActivity {
  kind: "orderSentence";
  items: Array<{ prompt: string; tokens: string[]; answer: number[] }>;
}

export type PracticeActivity =
  | MatchPairsActivity
  | MultipleChoiceActivity
  | TypeAnswerActivity
  | OrderSentenceActivity;

export interface PracticeStep {
  kind: "practice";
  activities: PracticeActivity[];
}

export interface SummaryStep {
  kind: "summary";
  title: string;
  points: string[];
}

export type AlphabetContentBlock =
  | ObjectiveStep
  | ExplanationStep
  | MultipleChoiceStep
  | DidYouKnowStep
  | VocabStep
  | PracticeStep
  | SummaryStep;

export interface AlphabetLesson {
  pattern: "alphabet";
  content: AlphabetContentBlock[];
  // Convenience accessors, derived from `content`, for callers that don't
  // want to walk the ordered block list.
  objective: ObjectiveStep | null;
  explanations: ExplanationStep[];
  didYouKnow: DidYouKnowStep[];
  vocab: VocabEntry[];
  practice: PracticeActivity[];
  summary: SummaryStep | null;
}

const PRACTICE_ACTIVITY_PARSERS: Record<string, (items: any[]) => PracticeActivity> = {
  "Match Pairs": (items) => ({
    kind: "matchPairs",
    items: items.map(([prompt, pairs]) => ({
      prompt,
      pairs: pairs as [string, string][],
    })),
  }),
  "Multiple Choice": (items) => ({
    kind: "multipleChoice",
    items: items.map(([prompt, options, answer]) => ({ prompt, options, answer })),
  }),
  "Type Answer": (items) => ({
    kind: "typeAnswer",
    items: items.map(([prompt, answer]) => ({ prompt, answer })),
  }),
  "Order Sentence": (items) => ({
    kind: "orderSentence",
    items: items.map(([prompt, tokens, answer]) => ({ prompt, tokens, answer })),
  }),
};

function parsePractice(activities: any[]): PracticeStep {
  const parsed: PracticeActivity[] = [];
  for (const [type, items] of activities) {
    const parser = PRACTICE_ACTIVITY_PARSERS[type];
    if (parser) {
      parsed.push(parser(items));
    }
    // Unknown activity types are silently skipped rather than throwing —
    // lesson JSON is content, not code, and shouldn't break rendering.
  }
  return { kind: "practice", activities: parsed };
}

function parseVocab(entries: any[]): VocabStep {
  return {
    kind: "vocab",
    entries: entries.map(([letter, ipa, uppercase, lowercase]) => ({
      letter,
      ipa,
      uppercase,
      lowercase,
    })),
  };
}

export function parseAlphabetLesson(steps: LessonStep[]): AlphabetLesson {
  const content: AlphabetContentBlock[] = [];

  for (const raw of steps as unknown as any[][]) {
    const [type, ...args] = raw;

    switch (type) {
      case "Objective": {
        const [title, points] = args;
        content.push({ kind: "objective", title, points });
        break;
      }
      case "Explanation": {
        const [body] = args;
        content.push({ kind: "explanation", body });
        break;
      }
      case "Multiple Choice": {
        const [prompt, options, answer] = args;
        content.push({ kind: "multipleChoice", prompt, options, answer });
        break;
      }
      case "Did You Know": {
        const [fact] = args;
        content.push({ kind: "didYouKnow", fact });
        break;
      }
      case "Vocab": {
        const [entries] = args;
        content.push(parseVocab(entries));
        break;
      }
      case "Practice": {
        const [activities] = args;
        content.push(parsePractice(activities));
        break;
      }
      case "Summary": {
        const [title, points] = args;
        content.push({ kind: "summary", title, points });
        break;
      }
      default:
        // Unknown block types are silently skipped rather than throwing —
        // lesson JSON is content, not code, and shouldn't break rendering.
        break;
    }
  }

  const lesson: AlphabetLesson = {
    pattern: "alphabet",
    content,
    objective: (content.find(b => b.kind === "objective") as ObjectiveStep) ?? null,
    explanations: content.filter((b): b is ExplanationStep => b.kind === "explanation"),
    didYouKnow: content.filter((b): b is DidYouKnowStep => b.kind === "didYouKnow"),
    vocab: (content.find(b => b.kind === "vocab") as VocabStep)?.entries ?? [],
    practice: (content.find(b => b.kind === "practice") as PracticeStep)?.activities ?? [],
    summary: (content.find(b => b.kind === "summary") as SummaryStep) ?? null,
  };

  return lesson;
}