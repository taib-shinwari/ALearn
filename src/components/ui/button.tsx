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
    "relative rounded-[40px] bg-white border-2 border-black text-black transition-colors duration-200",
    "inline-flex items-center justify-center gap-2",
    sizeClasses[size] || sizeClasses.default,
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

    const isGhost = variant === "ghost" || variant === "link";

    return (
      <button
        ref={ref}
        className={cn(
          "relative rounded-[40px] transition-colors duration-200 inline-flex items-center justify-center gap-2",
          !isGhost && "bg-white border-2 border-black text-black hover:bg-black hover:border-white hover:text-white",
          isGhost && "bg-transparent border-2 border-transparent text-black hover:bg-black hover:border-white hover:text-white",
          sizeClasses[size as string] || sizeClasses.md,
          fullWidth && "w-full",
          variant === "destructive" && "border-destructive text-destructive hover:bg-destructive hover:text-white",
          "disabled:opacity-50 disabled:pointer-events-none",
          active && "bg-black text-white border-white",
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
