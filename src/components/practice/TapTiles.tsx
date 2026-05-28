import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { X } from "lucide-react";

interface Props {
  options: string[];        // All tiles available (target tokens + distractors), shuffled
  picked: number[];         // Indices into options, in tap order
  onPick: (i: number) => void;
  onUnpick: (pos: number) => void;
  disabled?: boolean;
}

/** Sentence-builder UI. The parent owns picked state and validation. */
export function TapTiles({ options, picked, onPick, onUnpick, disabled }: Props) {
  return (
    <div className="space-y-4">
      {/* Answer slot */}
      <Container className="min-h-[64px] flex flex-wrap gap-2 items-center">
        {picked.length === 0 && (
          <span className="text-sm opacity-50">…</span>
        )}
        {picked.map((idx, pos) => (
          <Button
            key={`${idx}-${pos}`}
            size="sm"
            disabled={disabled}
            onClick={() => onUnpick(pos)}
            className="gap-1 h-8 px-3"
          >
            {options[idx]}
            <X className="h-3 w-3 opacity-60" />
          </Button>
        ))}
      </Container>

      {/* Tile bank */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const used = picked.includes(i);
          return (
            <Button
              key={i}
              size="sm"
              disabled={used || disabled}
              variant={used ? "ghost" : "secondary"}
              onClick={() => onPick(i)}
              className="h-9 px-3"
            >
              {opt}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
