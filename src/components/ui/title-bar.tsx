import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TitleBarProps {
  children: ReactNode;
  className?: string;
  /** When true, takes full width (block). Defaults to false — sized to content. */
  fullWidth?: boolean;
}

/**
 * Thin pill used for page titles and breadcrumb bars.
 * White background, black border, black text — no hover, no interactivity.
 * Sized to content by default; pass fullWidth to stretch.
 */
export function TitleBar({ children, className, fullWidth = false }: TitleBarProps) {
  return (
    <div
      className={cn(
        "rounded-[40px] bg-white border-2 border-black text-black px-4 py-2 text-sm",
        fullWidth ? "block w-full" : "inline-flex items-center w-fit max-w-full",
        className
      )}
    >
      {children}
    </div>
  );
}
