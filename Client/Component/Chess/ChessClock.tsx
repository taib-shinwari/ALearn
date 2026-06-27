import { cn } from "Client/Library/utils";

export function formatClock(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (ms < 10_000) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${m}:${s.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChessClock({ ms, active, low }: { ms: number; active: boolean; low?: boolean }) {
  return (
    <div
      className={cn(
        "px-4 py-2 rounded-[12px] border-2 border-border font-mono text-2xl font-bold tabular-nums text-center min-w-[110px] transition-colors",
        active ? "bg-foreground text-background" : "bg-background",
        low && ms < 10_000 && "text-red-500",
      )}
    >
      {formatClock(ms)}
    </div>
  );
}
