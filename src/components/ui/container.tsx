import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Non-interactable container surface.
 * White background, black border, black text. No hover, no scale.
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-white border-2 border-black text-black p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
