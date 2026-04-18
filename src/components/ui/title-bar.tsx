import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TitleBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Thin container used for page titles and breadcrumb bars.
 * White background, black border, black text — no hover, no interactivity.
 */
export function TitleBar({ children, className }: TitleBarProps) {
  return (
    <div
      className={cn(
        "rounded-[40px] bg-white border-2 border-black text-black px-4 py-2 text-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
