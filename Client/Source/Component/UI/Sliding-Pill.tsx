import { ReactNode, useState, useRef } from "react";
import { cn } from "@/Library/utils";

interface PillOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SlidingPillProps<T extends string> {
  options: PillOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  className?: string;
  width?: string;     // e.g., "w-24" or "w-48"
  height?: string;    // e.g., "h-7" or "h-8"
  fontSize?: string;  // e.g., "text-xs" or "text-sm"
}

export function SlidingPill<T extends string>({
  options,
  selectedValue,
  onChange,
  className,
  width = "w-48",
  height = "h-8",
  fontSize = "text-[10px]",
}: SlidingPillProps<T>) {
  const [isFlashing, setIsFlashing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeIndex = options.findIndex((opt) => opt.value === selectedValue);
  const pillPercentage = 100 / options.length;

  const handleSelect = (value: T) => {
    if (value !== selectedValue) {
      // Mobile tap feedback pulse (180ms)
      setIsFlashing(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
      }, 180);

      onChange(value);
    }
  };

  return (
    <div
      className={cn(
        "group/pill relative flex rounded-full border border-border select-none items-center overflow-hidden p-0.5 transition-colors duration-200",
        "bg-transparent",
        // Desktop Hover
        "has-[.is-inactive:hover]:bg-foreground has-[.is-inactive:hover]:border-foreground",
        // Mobile Tap Pulse
        isFlashing && "bg-foreground border-foreground",
        width,
        height,
        className
      )}
    >
      {/* 1. Sliding Background Indicator */}
      <div
        className={cn(
          "absolute top-0.5 bottom-0.5 left-0.5 rounded-full transition-all duration-200 ease-out pointer-events-none z-0",
          "bg-foreground",
          // Desktop Hover
          "group-has-[.is-inactive:hover]/pill:bg-background",
          // Mobile Tap Pulse
          isFlashing && "bg-background"
        )}
        style={{
          width: `calc(${pillPercentage}% - 2px)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {/* 2. Base Content Layer (Inactive Options) */}
      <div className="relative z-10 flex w-full h-full">
        {options.map((option) => {
          const isInactive = option.value !== selectedValue;
          return (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 font-bold uppercase tracking-wider h-full focus:outline-none transition-colors duration-200",
                isInactive ? "is-inactive text-muted-foreground/80 hover:text-background" : "text-transparent",
                isFlashing && isInactive && "text-background",
                fontSize
              )}
            >
              {option.icon ? (
                <span className="shrink-0 flex items-center justify-center">
                  {option.icon}
                </span>
              ) : (
                <span>{option.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Clipped Active Content Layer (Active Icon / Text) */}
      <div
        className="absolute inset-0 z-20 flex p-0.5 pointer-events-none transition-[clip-path] duration-200 ease-out"
        style={{
          clipPath: `inset(0% ${100 - (activeIndex + 1) * pillPercentage}% 0% ${activeIndex * pillPercentage}%)`,
        }}
      >
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 font-bold uppercase tracking-wider h-full transition-colors duration-200",
              "text-background",
              // Desktop Hover
              "group-has-[.is-inactive:hover]/pill:text-foreground",
              // Mobile Tap Pulse
              isFlashing && "text-foreground",
              fontSize
            )}
          >
            {option.icon ? (
              <span className="shrink-0 flex items-center justify-center">
                {option.icon}
              </span>
            ) : (
              <span>{option.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}