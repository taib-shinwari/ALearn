import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useApp } from "@/Context/App";
import { useIsMobile } from "@/Hook/use-mobile";
import { cn } from "@/Library/utils";

interface DeleteLanguageProps {
  languageName: string;
  onStateChange?: (isExpanded: boolean) => void;
}

export function DeleteLanguage({ languageName, onStateChange }: DeleteLanguageProps) {
  const navigate = useNavigate();
  const { removeCourse } = useApp();
  const isMobile = useIsMobile();
  
  // 0 = Initial (Icon X), 1 = Delete Language?, 2 = Sure?
  const [stage, setStage] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCooldown = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startCooldown = () => {
    clearCooldown();
    timerRef.current = setTimeout(() => {
      updateStage(0);
    }, 3000);
  };

  const updateStage = (nextStage: number) => {
    setStage(nextStage);
    if (onStateChange) {
      // Notify parent layout if text is currently expanded (stage 1 or 2)
      onStateChange(nextStage > 0);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        updateStage(0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearCooldown();
    };
  }, [onStateChange]);

  useEffect(() => {
    if (stage > 0) {
      startCooldown();
    } else {
      clearCooldown();
    }
    return () => clearCooldown();
  }, [stage]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (stage === 0) {
      updateStage(1);
    } else if (stage === 1) {
      updateStage(2);
    } else if (stage === 2) {
      removeCourse(languageName);
      updateStage(0);
      navigate("/Language");
    }
  };

  const getButtonText = () => {
    if (stage === 1) {
      return isMobile 
        ? "Delete Language?" 
        : `Delete ${languageName.charAt(0).toUpperCase() + languageName.slice(1)} Language?`;
    }
    if (stage === 2) {
      return isMobile ? "Sure?" : "Are you sure?";
    }
    return null;
  };

  return (
    <div ref={containerRef} className="shrink-0 h-9 flex items-center select-none">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "rounded-[40px] transition-colors duration-200 inline-flex items-center justify-center gap-2 p-2 relative h-auto border font-bold tracking-tight text-xs whitespace-nowrap z-50",
          
          // Stage 0: Neutral background & borders (38.21px x 38.21px)
          stage === 0 && "bg-background border-border text-foreground hover:bg-muted/60 w-[38.21px] aspect-square",
          
          // Stages 1 & 2: Red background confirmation accent parameters
          stage > 0 && "bg-background border-red-500 text-red-500 hover:bg-red-600 hover:text-white hover:border-black px-4"
        )}
        aria-label={stage === 0 ? "Delete track" : getButtonText() || "Confirm delete"}
      >
        {stage === 0 ? (
          <X className="h-5 w-5 stroke-[2]" />
        ) : (
          <span>{getButtonText()}</span>
        )}
      </button>
    </div>
  );
}