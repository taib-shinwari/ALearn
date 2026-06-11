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
      className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in-0"
    >
      {title && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b-2 border-border px-4 py-3">
          <h2 className="text-base font-semibold text-center">{title}</h2>
        </div>
      )}
      <div className={cn("max-w-2xl mx-auto p-4", className)}>{children}</div>
    </div>,
    document.body
  );
}
