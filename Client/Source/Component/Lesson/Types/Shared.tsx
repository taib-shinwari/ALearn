// Shared types + helpers used across every exercise type.
import { Button } from "@/Component/UI/button";
import { cn } from "@/Library/utils";

export interface ExerciseProps {
  step: any;
  onResult: (correct: boolean) => void;
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Shared bottom action bar ──────────────────────────────────────────────
// Fixed to the bottom of the viewport (not just the nearest scroll
// container). One button: full-width. Two buttons: stacked (primary on
// top) on mobile, side-by-side (secondary left / primary right) from sm: up.
export interface ActionBarProps {
  primary: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void; disabled?: boolean };
}
export function ActionBar({ primary, secondary }: ActionBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur pt-3 pb-[env(safe-area-inset-bottom)]">
      <div
        className={cn(
          "flex flex-col-reverse gap-2 px-4 pb-3 max-w-md lg:max-w-xl mx-auto",
          secondary && "sm:flex-row sm:justify-between",
        )}
      >
        {secondary && (
          <Button
            disabled={secondary.disabled}
            onClick={secondary.onClick}
            className="w-full sm:w-auto sm:min-w-[140px]"
          >
            {secondary.label}
          </Button>
        )}
        <Button
          active
          disabled={primary.disabled}
          onClick={primary.onClick}
          className="w-full sm:w-auto sm:min-w-[140px] sm:ml-auto"
        >
          {primary.label}
        </Button>
      </div>
    </div>
  );
}