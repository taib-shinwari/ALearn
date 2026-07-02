// Exercise components for the lessons runner. One file, multiple kinds.
import { useEffect, useMemo, useState } from "react";
import { CardButton } from "Client/Component/UI/card-button";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { cn } from "Client/Library/utils";

interface ExerciseProps {
  step: any;
  onResult: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Learn ─────────────────────────────────────────────────────────────────────
export function LearnExercise({ step, onResult }: ExerciseProps) {
  return (
    <Container className="p-6 text-center space-y-3">
      <p className="text-xs uppercase tracking-wider opacity-60">Learn</p>
      <h2 className="text-3xl font-bold">{step.word ?? step.title}</h2>
      {step.ipa && <p className="text-lg opacity-80 font-mono">{step.ipa}</p>}
      {step.note && <p className="text-sm opacity-70">{step.note}</p>}
      <Button active className="w-full" onClick={() => onResult(true)}>Got it</Button>
    </Container>
  );
}

// ── Flashcard ────────────────────────────────────────────────────────────────
export function FlashcardExercise({ step, onResult }: ExerciseProps) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Container className="p-6 text-center space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Flashcard — tap to flip</p>
      <button
        onClick={() => setFlipped(f => !f)}
        className="w-full min-h-[160px] rounded-2xl border-2 border-border flex items-center justify-center text-3xl font-bold hover:bg-muted"
      >
        {flipped ? step.back : step.front}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => onResult(false)}>Hard</Button>
        <Button active onClick={() => onResult(true)}>Easy</Button>
      </div>
    </Container>
  );
}

// ── Multiple Choice ──────────────────────────────────────────────────────────
export function MultipleChoiceExercise({ step, onResult }: ExerciseProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = picked === step.answer;
  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Multiple choice</p>
      <p className="text-lg font-semibold text-center">{step.prompt}</p>
      <div className="grid gap-2">
        {step.options.map((opt: string, i: number) => (
          <button
            key={i}
            disabled={checked}
            onClick={() => setPicked(i)}
            className={cn(
              "px-4 py-3 rounded-[14px] border-2 text-left font-semibold transition-colors",
              !checked && picked === i && "border-foreground bg-muted",
              !checked && picked !== i && "border-border hover:bg-muted",
              checked && i === step.answer && "border-emerald-500 bg-emerald-500/15",
              checked && picked === i && i !== step.answer && "border-rose-500 bg-rose-500/15",
              checked && picked !== i && i !== step.answer && "opacity-50",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {!checked ? (
        <Button active disabled={picked === null} className="w-full" onClick={() => setChecked(true)}>Check</Button>
      ) : (
        <Button active className="w-full" onClick={() => onResult(correct)}>Continue</Button>
      )}
    </Container>
  );
}

// ── Match Pairs ──────────────────────────────────────────────────────────────
export function MatchPairsExercise({ step, onResult }: ExerciseProps) {
  const pairs: [string, string][] = step.pairs;
  const [left] = useState(() => pairs.map(p => p[0]));
  const [right, setRight] = useState(() => shuffle(pairs.map(p => p[1])));
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);

  useEffect(() => {
    if (selLeft === null || selRight === null) return;
    const l = left[selLeft];
    const r = right[selRight];
    const isMatch = pairs.some(p => p[0] === l && p[1] === r);
    if (isMatch) {
      setMatched(m => new Set([...m, l, r]));
    } else {
      setWrong(w => w + 1);
    }
    setTimeout(() => { setSelLeft(null); setSelRight(null); }, 300);
  }, [selLeft, selRight, left, right, pairs]);

  useEffect(() => {
    if (matched.size === pairs.length * 2) {
      setTimeout(() => onResult(wrong <= 1), 400);
    }
  }, [matched, pairs.length, wrong, onResult]);

  const cell = (text: string, selected: boolean, done: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={done}
      className={cn(
        "px-3 py-3 rounded-[12px] border-2 font-semibold text-sm transition-all",
        done && "opacity-30 border-border",
        !done && selected && "border-foreground bg-muted",
        !done && !selected && "border-border hover:bg-muted",
      )}
    >{text}</button>
  );

  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60 text-center">Match the pairs</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((t, i) => cell(t, selLeft === i, matched.has(t), () => setSelLeft(i)))}
        </div>
        <div className="grid gap-2">
          {right.map((t, i) => cell(t, selRight === i, matched.has(t), () => setSelRight(i)))}
        </div>
      </div>
    </Container>
  );
}

// ── Build Translation / Order Sentence ───────────────────────────────────────
export function BuildExercise({ step, onResult }: ExerciseProps) {
  const tokens: string[] = step.tokens;
  const answer: number[] = step.answer;
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const correct = picked.length === answer.length && picked.every((p, i) => p === answer[i]);

  const toggle = (i: number) => {
    if (checked) return;
    setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Build the answer</p>
      <p className="text-base font-semibold text-center">{step.prompt}</p>
      <div className="min-h-[60px] p-3 rounded-[12px] border-2 border-dashed border-border flex flex-wrap gap-2">
        {picked.map((i, pos) => (
          <button key={pos} onClick={() => toggle(i)} disabled={checked}
            className="px-3 py-2 rounded-[10px] border-2 border-foreground bg-muted font-semibold text-sm">
            {tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {tokens.map((t, i) => (
          <button key={i} onClick={() => toggle(i)} disabled={checked || picked.includes(i)}
            className={cn(
              "px-3 py-2 rounded-[10px] border-2 font-semibold text-sm transition-colors",
              picked.includes(i) ? "opacity-30 border-border" : "border-border hover:bg-muted",
            )}>
            {t}
          </button>
        ))}
      </div>
      {!checked ? (
        <Button active disabled={picked.length === 0} className="w-full" onClick={() => setChecked(true)}>Check</Button>
      ) : (
        <div className="space-y-2">
          <p className={cn("text-center font-semibold", correct ? "text-emerald-500" : "text-rose-500")}>
            {correct ? "Correct!" : "Not quite."}
          </p>
          {!correct && (
            <p className="text-sm text-center opacity-70">Answer: {answer.map(i => tokens[i]).join(" ")}</p>
          )}
          <Button active className="w-full" onClick={() => onResult(correct)}>Continue</Button>
        </div>
      )}
    </Container>
  );
}

// ── Type Answer ──────────────────────────────────────────────────────────────
export function TypeAnswerExercise({ step, onResult }: ExerciseProps) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = text.trim().toLowerCase() === String(step.answer).trim().toLowerCase();
  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Type the answer</p>
      <p className="text-base font-semibold text-center">{step.prompt}</p>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={checked}
        className="w-full px-4 py-3 rounded-[12px] border-2 border-border bg-background"
      />
      {!checked ? (
        <Button active disabled={!text} className="w-full" onClick={() => setChecked(true)}>Check</Button>
      ) : (
        <div className="space-y-2">
          <p className={cn("text-center font-semibold", correct ? "text-emerald-500" : "text-rose-500")}>
            {correct ? "Correct!" : `Answer: ${step.answer}`}
          </p>
          <Button active className="w-full" onClick={() => onResult(correct)}>Continue</Button>
        </div>
      )}
    </Container>
  );
}

// ── Image Select ─────────────────────────────────────────────────────────────
export function ImageSelectExercise({ step, onResult }: ExerciseProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correctIdx = step.options.findIndex((o: any) => o.correct);
  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Pick the image</p>
      <p className="text-base font-semibold text-center">{step.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {step.options.map((opt: any, i: number) => (
          <button key={i} disabled={checked} onClick={() => setPicked(i)}
            className={cn(
              "rounded-[14px] border-2 overflow-hidden aspect-square flex items-center justify-center",
              !checked && picked === i && "border-foreground",
              !checked && picked !== i && "border-border hover:bg-muted",
              checked && i === correctIdx && "border-emerald-500",
              checked && picked === i && i !== correctIdx && "border-rose-500",
            )}>
            {opt.image
              ? <img src={opt.image} alt={opt.label ?? ""} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold p-4 text-center">{opt.label ?? "?"}</span>}
          </button>
        ))}
      </div>
      {!checked ? (
        <Button active disabled={picked === null} className="w-full" onClick={() => setChecked(true)}>Check</Button>
      ) : (
        <Button active className="w-full" onClick={() => onResult(picked === correctIdx)}>Continue</Button>
      )}
    </Container>
  );
}

// ── Objective ────────────────────────────────────────────────────────────────
export function ObjectiveExercise({ step, onResult }: ExerciseProps) {
  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Learning objective</p>
      <h2 className="text-2xl font-bold text-center">{step.title}</h2>
      <ul className="space-y-2 text-sm">
        {(step.points ?? []).map((p: string, i: number) => (
          <li key={i} className="flex gap-2"><span className="opacity-60">•</span><span>{p}</span></li>
        ))}
      </ul>
      <Button active className="w-full" onClick={() => onResult(true)}>Let's go</Button>
    </Container>
  );
}

// ── Explanation (with optional inline mini-check) ────────────────────────────
export function ExplanationExercise({ step, onResult }: ExerciseProps) {
  const q = step.question;
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = q ? picked === q.answer : true;

  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Explanation</p>
      {step.title && <h2 className="text-xl font-bold">{step.title}</h2>}
      <p className="text-sm leading-relaxed">{step.body}</p>
      {q && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold">{q.prompt}</p>
          <div className="grid gap-2">
            {q.options.map((opt: string, i: number) => (
              <button
                key={i}
                disabled={checked}
                onClick={() => setPicked(i)}
                className={cn(
                  "px-4 py-2.5 rounded-[12px] border-2 text-left font-semibold text-sm transition-colors",
                  !checked && picked === i && "border-foreground bg-muted",
                  !checked && picked !== i && "border-border hover:bg-muted",
                  checked && i === q.answer && "border-emerald-500 bg-emerald-500/15",
                  checked && picked === i && i !== q.answer && "border-rose-500 bg-rose-500/15",
                  checked && picked !== i && i !== q.answer && "opacity-50",
                )}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}
      {q ? (
        !checked ? (
          <Button active disabled={picked === null} className="w-full" onClick={() => setChecked(true)}>Check</Button>
        ) : (
          <Button active className="w-full" onClick={() => onResult(correct)}>Continue</Button>
        )
      ) : (
        <Button active className="w-full" onClick={() => onResult(true)}>Continue</Button>
      )}
    </Container>
  );
}

// ── Did You Know ─────────────────────────────────────────────────────────────
export function DidYouKnowExercise({ step, onResult }: ExerciseProps) {
  return (
    <Container className="p-6 text-center space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Did you know?</p>
      <p className="text-base leading-relaxed">{step.fact}</p>
      <Button active className="w-full" onClick={() => onResult(true)}>Cool</Button>
    </Container>
  );
}

// ── Vocab (letter/word with TTS) ─────────────────────────────────────────────
export function VocabExercise({ step, onResult }: ExerciseProps) {
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(step.sound ?? step.letter ?? step.word ?? "");
      u.lang = step.lang ?? "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  };
  useEffect(() => { speak(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const main = step.letter ?? step.word ?? step.title;
  return (
    <Container className="p-6 text-center space-y-3">
      <p className="text-xs uppercase tracking-wider opacity-60">Vocabulary</p>
      <button onClick={speak} className="text-7xl font-bold py-4 w-full rounded-[16px] hover:bg-muted transition-colors">
        {main}
      </button>
      {step.uppercase && step.lowercase && (
        <p className="text-2xl font-mono opacity-80">{step.uppercase} · {step.lowercase}</p>
      )}
      {step.ipa && <p className="text-lg opacity-70 font-mono">{step.ipa}</p>}
      {step.note && <p className="text-sm opacity-70">{step.note}</p>}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button onClick={speak}>Play sound</Button>
        <Button active onClick={() => onResult(true)}>Next</Button>
      </div>
    </Container>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────
export function SummaryExercise({ step, onResult }: ExerciseProps) {
  return (
    <Container className="p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-60">Summary</p>
      <h2 className="text-xl font-bold">{step.title ?? "You learned"}</h2>
      <ul className="space-y-2 text-sm">
        {(step.points ?? []).map((p: string, i: number) => (
          <li key={i} className="flex gap-2"><span className="opacity-60">✓</span><span>{p}</span></li>
        ))}
      </ul>
      <Button active className="w-full" onClick={() => onResult(true)}>Finish</Button>
    </Container>
  );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function Exercise({ step, onResult }: ExerciseProps) {
  switch (step.kind) {
    case "objective":        return <ObjectiveExercise step={step} onResult={onResult} />;
    case "explanation":      return <ExplanationExercise step={step} onResult={onResult} />;
    case "didYouKnow":       return <DidYouKnowExercise step={step} onResult={onResult} />;
    case "vocab":            return <VocabExercise step={step} onResult={onResult} />;
    case "summary":          return <SummaryExercise step={step} onResult={onResult} />;
    case "activeRecall":     return <ExplanationExercise step={step} onResult={onResult} />;
    case "learn":            return <LearnExercise step={step} onResult={onResult} />;
    case "flashcard":        return <FlashcardExercise step={step} onResult={onResult} />;
    case "multipleChoice":   return <MultipleChoiceExercise step={step} onResult={onResult} />;
    case "matchPairs":       return <MatchPairsExercise step={step} onResult={onResult} />;
    case "buildTranslation":
    case "orderSentence":    return <BuildExercise step={step} onResult={onResult} />;
    case "fillBlank":
    case "typeAnswer":
    case "listenType":       return <TypeAnswerExercise step={step} onResult={onResult} />;
    case "imageSelect":      return <ImageSelectExercise step={step} onResult={onResult} />;
    case "listenChoose":     return <MultipleChoiceExercise step={step} onResult={onResult} />;
    case "speaking":         return <LearnExercise step={step} onResult={onResult} />;
    default:                 return <LearnExercise step={step} onResult={onResult} />;
  }
}
