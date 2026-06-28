import { cn } from "Client/Library/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";

interface CardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Interactive card surface that uses the practice-button styling:
 * white bg / black border / black text → hover: black bg / white border / white text.
 * Same shape as Container but interactable.
 */
export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "rounded-full bg-background border border-border text-foreground p-4 text-left",
          "transition-colors duration-200",
          "hover:bg-muted/60 hover:border-border",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CardButton.displayName = "CardButton";
