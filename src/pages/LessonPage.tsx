import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Exercise {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

const lessonData: Record<string, { title: string; exercises: Exercise[] }> = {
  greetings: {
    title: "Greetings",
    exercises: [
      { question: 'How do you say "Good morning" in Dutch?', options: ["Goedemorgen", "Goedenavond", "Goedenacht", "Hallo"], correct: 0, explanation: '"Goedemorgen" literally means "Good morning". "Goedenavond" = Good evening, "Goedenacht" = Good night.' },
      { question: 'What does "Tot ziens" mean?', options: ["Hello", "Thank you", "Goodbye", "Please"], correct: 2, explanation: '"Tot ziens" is a formal way to say "Goodbye" in Dutch. "Tot" means "until" and "ziens" means "seeing".' },
      { question: 'Translate: "Hoe gaat het?"', options: ["What is your name?", "How are you?", "Where are you?", "How old are you?"], correct: 1, explanation: '"Hoe" means "How", "gaat" means "goes", "het" means "it". Together: "How goes it?" = "How are you?"' },
    ],
  },
};

export default function LessonPage() {
  const navigate = useNavigate();
  const { currentLesson } = useApp();
  const lessonId = currentLesson || "greetings";
  const lesson = lessonData[lessonId];

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Lesson not found.</p>
        <Button onClick={() => navigate("/home")} className="ml-2">Home</Button>
      </div>
    );
  }

  const current = lesson.exercises[step];
  const isLast = step === lesson.exercises.length - 1;
  const progress = ((step + (checked && isCorrect ? 1 : 0)) / lesson.exercises.length) * 100;

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
    setIsCorrect(selected === current.correct);
  };

  const handleContinue = () => {
    if (isLast) {
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setChecked(false);
      setIsCorrect(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <h2 className="text-lg font-medium mb-6">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt, i) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            if (checked && selected === i) {
              variant = isCorrect ? "default" : "destructive";
            } else if (!checked && selected === i) {
              variant = "default";
            }
            return (
              <Button
                key={i}
                variant={variant}
                className="w-full"
                disabled={checked}
                onClick={() => setSelected(i)}
              >
                {opt}
              </Button>
            );
          })}
        </div>

        {/* Feedback after check */}
        {checked && !isCorrect && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Incorrect</p>
            {current.explanation && (
              <p className="text-sm text-muted-foreground mt-1">{current.explanation}</p>
            )}
            <p className="text-sm mt-1">Correct answer: <span className="font-medium">{current.options[current.correct]}</span></p>
          </div>
        )}
        {checked && isCorrect && (
          <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">Correct!</p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 max-w-md mx-auto w-full space-y-2">
        {!checked ? (
          <>
            <Button className="w-full" disabled={selected === null} onClick={handleCheck}>
              Check
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSkip}>
              Skip
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={handleContinue}>
            {isLast ? "Finish Lesson" : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
}
