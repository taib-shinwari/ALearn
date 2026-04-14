import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";

interface Exercise {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | number;
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
    question: 'Read the following: "Hallo, hoe gaat het?" means "Hello, how are you?" — What does "hoe gaat het" mean?',
    options: ["How are you", "Goodbye", "Thank you", "Good morning"],
    correctAnswer: 0,
  },
  {
    type: "multiple",
    question: 'What is the Dutch word for "Thank you"?',
    options: ["Alsjeblieft", "Dank je", "Hallo", "Tot ziens"],
    correctAnswer: 1,
  },
  {
    type: "truefalse",
    question: '"Goedemorgen" means "Good evening" — True or False?',
    options: ["True", "False"],
    correctAnswer: 1,
  },
];

export default function IntroductionPage() {
  const { completeIntroduction } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = exercises[step];
  const isLast = step === exercises.length - 1;

  const handleOptionSelect = (idx: number) => {
    setSelected(idx);
    if (idx === current.correctAnswer) {
      setFeedback("Correct!");
    } else {
      setFeedback("Incorrect, try again.");
    }
  };

  const handleMatchSelect = (idx: number) => {
    if (!matchedPairs.includes(idx)) {
      const next = [...matchedPairs, idx];
      setMatchedPairs(next);
      if (current.pairs && next.length === current.pairs.length) {
        setFeedback("All matched!");
      }
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
      setFeedback(null);
    }
  };

  const canContinue =
    current.type === "match"
      ? current.pairs && matchedPairs.length === current.pairs.length
      : selected === current.correctAnswer;

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <span className="font-semibold">Introduction</span>
        <span className="text-sm text-muted-foreground">{step + 1}/{exercises.length}</span>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-1 uppercase">{current.type} exercise</p>
        <h2 className="text-lg font-medium mb-4">{current.question}</h2>

        {current.type === "match" && current.pairs && (
          <div className="space-y-2">
            {current.pairs.map((pair, i) => (
              <Button
                key={i}
                variant={matchedPairs.includes(i) ? "default" : "outline"}
                className="w-full justify-between"
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
                variant={selected === i ? (i === current.correctAnswer ? "default" : "destructive") : "outline"}
                className="w-full"
                onClick={() => handleOptionSelect(i)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

        {feedback && <p className="mt-3 text-sm font-medium">{feedback}</p>}

        <Button className="w-full mt-6" disabled={!canContinue} onClick={handleContinue}>
          {isLast ? "Finish Introduction" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
