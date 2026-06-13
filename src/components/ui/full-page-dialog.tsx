// Full-screen overlay that closes on browser back without leaving the route.
// Registers itself on a global dialog stack so the app Layout can show its
// title in the header and route the header's back button to close it.
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { pushDialog, removeDialog, updateDialog } from "@/lib/dialog-stack";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const TAG = "__fp_dialog__";

export function FullPageDialog({ open, onOpenChange, title, children, className }: Props) {
  const id = useId();
  const pushedRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;

    // Push a sentinel history entry so browser-back also closes us.
    try {
      window.history.pushState({ [TAG]: true, t: Date.now() }, "");
      pushedRef.current = true;
    } catch { /* noop */ }

    const close = () => onOpenChangeRef.current(false);
    pushDialog({ id, title, close });

    const onPop = () => { pushedRef.current = false; close(); };
    window.addEventListener("popstate", onPop);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      removeDialog(id);
      if (pushedRef.current) {
        pushedRef.current = false;
        try {
          if ((window.history.state as any)?.[TAG]) window.history.back();
        } catch { /* noop */ }
      }
    };
  }, [open, id]);

  // Keep title in sync if it changes while open.
  useEffect(() => {
    if (open) updateDialog(id, { title });
  }, [title, open, id]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed left-0 right-0 bottom-0 top-[72px] z-40 bg-background overflow-y-auto animate-in fade-in-0"
    >
      <div className={cn("max-w-2xl mx-auto p-4", className)}>{children}</div>
    </div>,
    document.body
  );
}
