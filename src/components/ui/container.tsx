import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-background border-2 border-foreground p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
