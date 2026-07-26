// @/Component/UI/Button.tsx
import { cn } from "@/Library/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "default" | "icon";
  className?: string;
  active?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      className,
      active = false,
      fullWidth,
      asChild,
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<string, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      default: "px-4 py-2 text-sm",
      icon: "p-0 flex items-center justify-center shrink-0",
    };

    const isGhost = variant === "ghost" || variant === "link";

    return (
      <button
        ref={ref}
        data-active={active ? "true" : undefined}
        className={cn(
          // CHANGED: rounded-[40px] -> rounded-full (9999px)
          "group relative rounded-full border transition-colors duration-200 inline-flex items-center justify-center gap-2 select-none",

          // 1. INACTIVE STATE
          !active && !isGhost && [
            "bg-background text-foreground border-border",
            "hover:bg-foreground hover:text-background hover:border-foreground"
          ],
          
          !active && isGhost && [
            "bg-transparent text-foreground border-transparent",
            "hover:bg-foreground hover:text-background"
          ],

          // 2. ACTIVE STATE (Automatic & Inverted on Hover)
          active && [
            "bg-foreground text-background border-foreground",
            "hover:!bg-background hover:!text-foreground hover:!border-foreground"
          ],

          // Support manual .active class as fallback
          "[&.active]:bg-foreground [&.active]:text-background [&.active]:border-foreground",
          "[&.active]:hover:!bg-background [&.active]:hover:!text-foreground [&.active]:hover:!border-foreground",

          sizeClasses[size as string] || sizeClasses.md,
          fullWidth && "w-full",
          variant === "destructive" && "border-destructive text-destructive hover:bg-destructive/10",
          "disabled:opacity-50 disabled:pointer-events-none",
          
          // --- HIGH CONTRAST MODES ---
          "[.high-contrast_&]:border-2 [.high-contrast_&]:border-foreground [.high-contrast_&]:font-bold",
          "[.hc_&]:border-2 [.hc_&]:border-foreground [.hc_&]:font-bold",

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";