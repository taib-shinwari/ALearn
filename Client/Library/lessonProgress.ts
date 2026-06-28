// Tiny module-level store so the global Layout header can render a progress
// bar driven by whichever LessonRunner is currently mounted.
export type LessonProgressState = { current: number; total: number } | null;

let state: LessonProgressState = null;
const listeners = new Set<() => void>();

export const lessonProgress = {
  set(s: LessonProgressState) {
    state = s;
    listeners.forEach(l => l());
  },
  get(): LessonProgressState {
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
