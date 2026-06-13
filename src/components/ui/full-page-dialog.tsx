// Full-screen overlay that closes on browser back without leaving the route.
// Pushes a history entry on open; a popstate or programmatic close pops it.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const TAG = "__fp_dialog__";

export function FullPageDialog({ open, onOpenChange, title, children, className }: Props) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    // Push a sentinel state so the next "back" closes us.
    try {
      window.history.pushState({ [TAG]: true, t: Date.now() }, "");
      pushedRef.current = true;
    } catch { /* noop */ }

    const onPop = () => {
      pushedRef.current = false;
      onOpenChange(false);
    };
    window.addEventListener("popstate", onPop);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      // If we still have our sentinel on top, pop it so history stays clean.
      if (pushedRef.current) {
        pushedRef.current = false;
        try {
          if ((window.history.state as any)?.[TAG]) window.history.back();
        } catch { /* noop */ }
      }
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed left-0 right-0 bottom-0 top-[72px] z-40 bg-background overflow-y-auto animate-in fade-in-0"
    >
      {title && (
        <div className="px-4 pt-2">
          <div className="rounded-[40px] bg-background border-2 border-border text-foreground px-4 py-2 text-sm font-semibold inline-flex w-fit">
            {title}
          </div>
        </div>
      )}
      <div className={cn("max-w-2xl mx-auto p-4", className)}>{children}</div>
    </div>,
    document.body
  );
}
