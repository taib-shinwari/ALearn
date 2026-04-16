import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";

// Compatibility: buttonVariants as a callable for shadcn components that import it
export function buttonVariants({
  variant = "secondary",
  size = "default",
  className = "",
}: {
  variant?: string;
  size?: string;
  className?: string;
} = {}): string {
  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    default: "px-4 py-2 text-sm",
    icon: "p-2",
  };

  return cn(
    "relative rounded-[40px] bg-background border-2 border-foreground transition-all duration-200",
    "inline-flex items-center justify-center gap-2",
    sizeClasses[size] || sizeClasses.default,
    variant === "primary" && "text-primary",
    variant === "destructive" && "border-destructive text-destructive",
    variant === "ghost" && "border-transparent bg-transparent",
    variant === "link" && "border-transparent bg-transparent underline underline-offset-4",
    className
  );
}

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
      active,
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
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative rounded-[40px] bg-background border-2 border-foreground transition-all duration-200",
          "inline-flex items-center justify-center gap-2",
          sizeClasses[size as string] || sizeClasses.md,
          fullWidth && "w-full",
          variant === "primary" && "text-primary",
          variant === "destructive" && "border-destructive text-destructive",
          variant === "ghost" && "border-transparent bg-transparent",
          variant === "link" && "border-transparent bg-transparent underline underline-offset-4",
          "hover:scale-[1.02] hover:bg-foreground hover:border-background hover:text-background",
          "disabled:opacity-50 disabled:pointer-events-none",
          active && "bg-foreground text-background border-background",
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
