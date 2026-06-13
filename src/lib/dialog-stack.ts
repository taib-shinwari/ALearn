// Global stack of open full-page dialogs.
// Layout reads this to show the dialog's title in the header and to make the
// back button close the topmost dialog instead of navigating back.
import { useEffect, useState } from "react";

export interface DialogEntry {
  id: string;
  title?: string;
  close: () => void;
}

let stack: DialogEntry[] = [];
const subs = new Set<() => void>();

function emit() { subs.forEach(fn => fn()); }

export function pushDialog(entry: DialogEntry) {
  stack = [...stack.filter(x => x.id !== entry.id), entry];
  emit();
}

export function updateDialog(id: string, patch: Partial<DialogEntry>) {
  let changed = false;
  stack = stack.map(e => {
    if (e.id !== id) return e;
    changed = true;
    return { ...e, ...patch };
  });
  if (changed) emit();
}

export function removeDialog(id: string) {
  const next = stack.filter(x => x.id !== id);
  if (next.length !== stack.length) { stack = next; emit(); }
}

export function getTopDialog(): DialogEntry | null {
  return stack[stack.length - 1] ?? null;
}

export function useTopDialog(): DialogEntry | null {
  const [top, setTop] = useState<DialogEntry | null>(getTopDialog);
  useEffect(() => {
    const cb = () => setTop(getTopDialog());
    subs.add(cb);
    return () => { subs.delete(cb); };
  }, []);
  return top;
}
