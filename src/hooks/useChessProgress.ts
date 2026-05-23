import { useEffect, useState, useCallback } from "react";

const KEY = "chessProgress";

interface Progress {
  lessons: string[];
  puzzles: string[];
}

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lessons: [], puzzles: [] };
    const p = JSON.parse(raw);
    return { lessons: p.lessons ?? [], puzzles: p.puzzles ?? [] };
  } catch {
    return { lessons: [], puzzles: [] };
  }
}

export function useChessProgress() {
  const [progress, setProgress] = useState<Progress>(read);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  const completeLesson = useCallback((id: string) => {
    setProgress(p => p.lessons.includes(id) ? p : { ...p, lessons: [...p.lessons, id] });
  }, []);
  const completePuzzle = useCallback((id: string) => {
    setProgress(p => p.puzzles.includes(id) ? p : { ...p, puzzles: [...p.puzzles, id] });
  }, []);

  return { progress, completeLesson, completePuzzle };
}
