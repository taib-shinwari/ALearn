import { ReactNode } from "react";
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
  // Custom styling injections
  width?: string;     // e.g., "w-24" or "w-48" (Tailwind class)
  height?: string;    // e.g., "h-7" or "h-9" (Tailwind class)
  fontSize?: string;  // e.g., "text-xs" or "text-sm" (Tailwind class)
}

export function SlidingPill<T extends string>({
  options,
  selectedValue,
  onChange,
  className,
  width = "w-48",
  height = "h-7",
  fontSize = "text-[10px]",
}: SlidingPillProps<T>) {
  const activeIndex = options.findIndex((opt) => opt.value === selectedValue);

  return (
    <div
      className={cn(
        "relative flex p-0.5 rounded-full bg-muted border border-border/40 select-none items-center",
        width,
        height,
        className
      )}
    >
      {/* Sliding Background Indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 2px)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => {
        const isActive = option.value === selectedValue;
        return (
          <button
            key={option.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(option.value);
            }}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1 font-bold uppercase tracking-wider transition-colors duration-150 h-full focus:outline-none",
              fontSize,
              isActive
                ? "text-foreground"
                : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            {option.icon ? (
              <span className="shrink-0">{option.icon}</span>
            ) : (
              <span>{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}