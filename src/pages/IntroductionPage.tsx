import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Exercise {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  pairs?: { left: string; right: string }[];
}

const exercises: Exercise[] = [
  {
    type: "match",
    question: "Match the pairs by selecting the correct translation:",
    pairs: [
      { left: "Hello", right: "Hallo" },
      { left: "Goodbye", right: "Tot ziens" },
    ],
    correctAnswer: "matched",
  },
  {
    type: "reading",
    question: '"Hallo, hoe gaat het?" means "Hello, how are you?" — What does "hoe gaat het" mean?',
    options: ["How are you", "Goodbye", "Thank you", "Good morning"],
    correctAnswer: 0,
    explanation: '"Hoe gaat het" literally translates to "How goes it", meaning "How are you?"',
  },
  {
    type: "multiple",
    question: 'What is the Dutch word for "Thank you"?',
    options: ["Alsjeblieft", "Dank je", "Hallo", "Tot ziens"],
    correctAnswer: 1,
    explanation: '"Dank je" is informal "Thank you". "Alsjeblieft" means "Please" or "Here you go".',
  },
  {
    type: "truefalse",
    question: '"Goedemorgen" means "Good evening" — True or False?',
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: '"Goedemorgen" means "Good morning", not "Good evening". "Good evening" is "Goedenavond".',
  },
];

export default function IntroductionPage() {
  const { completeIntroduction } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const current = exercises[step];
  const isLast = step === exercises.length - 1;
  const progress = ((step + (checked && isCorrect ? 1 : 0)) / exercises.length) * 100;

  const handleMatchSelect = (idx: number) => {
    if (checked) return;
    if (!matchedPairs.includes(idx)) {
      setMatchedPairs([...matchedPairs, idx]);
    }
  };

  const handleCheck = () => {
    if (current.type === "match") {
      const allMatched = current.pairs && matchedPairs.length === current.pairs.length;
      setChecked(true);
      setIsCorrect(!!allMatched);
    } else {
      if (selected === null) return;
      setChecked(true);
      setIsCorrect(selected === current.correctAnswer);
    }
  };

  const handleContinue = () => {
    if (isLast) {
      completeIntroduction();
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setMatchedPairs([]);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      completeIntroduction();
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setMatchedPairs([]);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  const canCheck =
    current.type === "match"
      ? current.pairs && matchedPairs.length === current.pairs.length
      : selected !== null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{current.type}</p>
        <h2 className="text-lg font-semibold mb-6">{current.question}</h2>

        {current.type === "match" && current.pairs && (
          <div className="space-y-2">
            {current.pairs.map((pair, i) => (
              <Button
                key={i}
                active={matchedPairs.includes(i)}
                fullWidth
                className="justify-between"
                disabled={checked}
                onClick={() => handleMatchSelect(i)}
              >
                <span>{pair.left}</span>
                <span>→ {pair.right}</span>
              </Button>
            ))}
          </div>
        )}

        {(current.type === "multiple" || current.type === "reading" || current.type === "truefalse") && current.options && (
          <div className="space-y-2">
            {current.options.map((opt, i) => (
              <Button
                key={i}
                active={selected === i && !checked}
                variant={
                  checked && selected === i
                    ? isCorrect ? "primary" : "destructive"
                    : "secondary"
                }
                fullWidth
                disabled={checked}
                onClick={() => setSelected(i)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

        {checked && !isCorrect && current.type !== "match" && (
          <div className="mt-4 p-3 rounded-[20px] border-2 border-destructive">
            <p className="text-sm font-medium text-destructive">Incorrect</p>
            {current.explanation && (
              <p className="text-sm text-muted-foreground mt-1">{current.explanation}</p>
            )}
            <p className="text-sm mt-1">Correct answer: <span className="font-medium">{current.options?.[current.correctAnswer as number]}</span></p>
          </div>
        )}
        {checked && isCorrect && (
          <div className="mt-4 p-3 rounded-[20px] border-2 border-green-500">
            <p className="text-sm font-medium text-green-600">Correct! ✨</p>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto w-full space-y-2">
        {!checked ? (
          <>
            <Button fullWidth disabled={!canCheck} onClick={handleCheck}>
              Check
            </Button>
            <Button variant="ghost" fullWidth onClick={handleSkip}>
              Skip
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={handleContinue}>
            {isLast ? "Finish Introduction" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}
