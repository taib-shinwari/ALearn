import { useEffect, useRef } from "react";
import { Container } from "@/components/ui/container";

export function MovesList({ sans }: { sans: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [sans.length]);
  const pairs: Array<[string, string | undefined]> = [];
  for (let i = 0; i < sans.length; i += 2) pairs.push([sans[i], sans[i + 1]]);
  return (
    <Container className="p-2">
      <div ref={ref} className="max-h-[260px] overflow-y-auto font-mono text-sm">
        {pairs.length === 0 && <p className="opacity-60 text-center py-4">—</p>}
        {pairs.map(([w, b], i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 px-1 py-0.5 hover:bg-muted/40 rounded">
            <span className="opacity-60">{i + 1}.</span>
            <span>{w}</span>
            <span>{b ?? ""}</span>
          </div>
        ))}
      </div>
    </Container>
  );
}
