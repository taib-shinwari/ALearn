import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";

const lessonData: Record<string, { title: string; exercises: { question: string; options: string[]; correct: number }[] }> = {
  greetings: {
    title: "Greetings",
    exercises: [
      { question: 'How do you say "Good morning" in Dutch?', options: ["Goedemorgen", "Goedenavond", "Goedenacht", "Hallo"], correct: 0 },
      { question: 'What does "Tot ziens" mean?', options: ["Hello", "Thank you", "Goodbye", "Please"], correct: 2 },
      { question: 'Translate: "Hoe gaat het?"', options: ["What is your name?", "How are you?", "Where are you?", "How old are you?"], correct: 1 },
    ],
  },
};

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = lessonData[lessonId || ""];
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setFeedback(idx === current.correct ? "Correct!" : "Incorrect, try again.");
  };

  const handleContinue = () => {
    if (isLast) {
      navigate("/home");
    } else {
      setStep(step + 1);
      setSelected(null);
      setFeedback(null);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <span className="font-semibold">{lesson.title}</span>
        <span className="text-sm text-muted-foreground">{step + 1}/{lesson.exercises.length}</span>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-lg font-medium mb-4">{current.question}</h2>
        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <Button
              key={i}
              variant={selected === i ? (i === current.correct ? "default" : "destructive") : "outline"}
              className="w-full"
              onClick={() => handleSelect(i)}
            >
              {opt}
            </Button>
          ))}
        </div>
        {feedback && <p className="mt-3 text-sm font-medium">{feedback}</p>}
        <Button className="w-full mt-6" disabled={selected !== current.correct} onClick={handleContinue}>
          {isLast ? "Finish Lesson" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
