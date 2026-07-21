// @/Component/Word/Buttons/SpeakButton.tsx
import { Volume2 } from "lucide-react";
import { speak, isSpeechAvailable } from "@/Component/Practice/speech";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { cn } from "@/Library/utils";

interface SpeakButtonProps {
  targetText: string;
  className?: string;
}

export function SpeakButton({ targetText, className }: SpeakButtonProps) {
  const { courseLang, t } = useCourseLanguage();

  if (!isSpeechAvailable()) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(targetText, courseLang as any);
      }}
      className={cn(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors",
        className
      )}
      aria-label={t("play") || "Play"}
    >
      <Volume2 className="h-5 w-5" />
    </button>
  );
}