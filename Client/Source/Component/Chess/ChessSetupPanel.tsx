import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { TitleBar } from "@/Component/UI/title-bar";
import { Button } from "@/Component/UI/Button";
import { Slider } from "@/Component/UI/slider";
import { Switch } from "@/Component/UI/switch";
import { cn } from "@/Library/utils";
import { Play } from "lucide-react";

export type ColorChoice = "white" | "black" | "random";
export interface TimerPreset {
  id: string;
  label: string;
  baseMs: number; // per side
  incMs: number;
}

const TIMER_GROUPS: Array<{ label: string; presets: TimerPreset[] }> = [
  { label: "—", presets: [{ id: "none", label: "No Timer", baseMs: 0, incMs: 0 }] },
  { label: "Bullet", presets: [
    { id: "1m", label: "1m", baseMs: 60_000, incMs: 0 },
    { id: "1|1", label: "1 | 1", baseMs: 60_000, incMs: 1_000 },
    { id: "2|1", label: "2 | 1", baseMs: 120_000, incMs: 1_000 },
  ]},
  { label: "Blitz", presets: [
    { id: "3|2", label: "3 | 2", baseMs: 180_000, incMs: 2_000 },
    { id: "5m", label: "5m", baseMs: 300_000, incMs: 0 },
    { id: "5|5", label: "5 | 5", baseMs: 300_000, incMs: 5_000 },
  ]},
  { label: "Rapid", presets: [
    { id: "10m", label: "10 Min", baseMs: 600_000, incMs: 0 },
    { id: "15|10", label: "15 | 10", baseMs: 900_000, incMs: 10_000 },
    { id: "30m", label: "30 Min", baseMs: 1_800_000, incMs: 0 },
    { id: "10|5", label: "10 | 5", baseMs: 600_000, incMs: 5_000 },
    { id: "20m", label: "20 Min", baseMs: 1_200_000, incMs: 0 },
    { id: "60m", label: "60 Min", baseMs: 3_600_000, incMs: 0 },
  ]},
];

export interface GameConfig {
  elo: number;
  color: ColorChoice;
  timer: TimerPreset;
  variant: "standard" | "960";
  evalBar: boolean;
  threatArrows: boolean;
  suggestionArrows: boolean;
  moveFeedback: boolean;
  engine: boolean;
}

interface Props { onPlay: (cfg: GameConfig) => void }

export function ChessSetupPanel({ onPlay }: Props) {
  const [elo, setElo] = useState(400);
  const [color, setColor] = useState<ColorChoice>("white");
  const [timer, setTimer] = useState<TimerPreset>(TIMER_GROUPS[0].presets[0]);
  const [variant, setVariant] = useState<"standard" | "960">("standard");
  const [evalBar, setEvalBar] = useState(false);
  const [threatArrows, setThreatArrows] = useState(false);
  const [suggestionArrows, setSuggestionArrows] = useState(false);
  const [moveFeedback, setMoveFeedback] = useState(false);
  const [engine, setEngine] = useState(true);

  const seg = (active: boolean) =>
    cn("px-3 py-2 rounded-[10px] border-2 border-border text-xs font-medium transition-colors w-full text-center",
      active ? "bg-foreground text-background" : "bg-background hover:bg-muted");

  return (
    <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-4">
      
      {/* Column Left: Engine Strength Card */}
      <Container className="p-3 space-y-2 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Engine Strength</span>
          <span className="font-mono text-xs opacity-70">{elo} ELO</span>
        </div>
        <Slider min={100} max={3200} step={100} value={[elo]} onValueChange={v => setElo(v[0])} />
      </Container>

      {/* Column Right: Play As Side Picker Card */}
      <Container className="p-3 space-y-2 flex flex-col justify-center">
        <span className="text-sm font-semibold block">Play as</span>
        <div className="grid grid-cols-3 gap-2">
          {(["white", "random", "black"] as const).map(c => (
            <button key={c} onClick={() => setColor(c)} className={seg(color === c)}>
              {c[0].toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </Container>

      {/* Row Spanner Layout Block: Presets (Takes full width to preserve visibility parameters) */}
      <Container className="p-4 space-y-3 md:col-span-2">
        <span className="text-sm font-semibold block border-b pb-1">Timer Configuration</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {TIMER_GROUPS.map(g => (
            <div key={g.label} className="space-y-1.5 bg-muted/30 p-2 rounded-[12px] border">
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 px-1">
                {g.label === "—" ? "Standard Layout" : g.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.presets.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => setTimer(p)} 
                    className={cn(seg(timer.id === p.id), "px-2 py-1.5 text-[11px] flex-1 min-w-[65px]")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Column Left: Rules Variant Selector */}
      <Container className="p-3 space-y-2 flex flex-col justify-center">
        <span className="text-sm font-semibold block">Variant</span>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setVariant("standard")} className={seg(variant === "standard")}>Standard</button>
          <button onClick={() => setVariant("960")} className={seg(variant === "960")}>960</button>
        </div>
      </Container>

      {/* Column Right: Engine Assist Feature Toggles */}
      <Container className="p-3 space-y-2.5 flex flex-col justify-center">
        {([
          ["Evaluation Bar", evalBar, setEvalBar],
          ["Threat Arrows", threatArrows, setThreatArrows],
          ["Suggestion Arrows", suggestionArrows, setSuggestionArrows],
          ["Move Feedback", moveFeedback, setMoveFeedback],
          ["Engine", engine, setEngine],
        ] as Array<[string, boolean, (v: boolean) => void]>).map(([label, val, setter]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs font-medium">{label}</span>
            <Switch checked={val} onCheckedChange={setter} className="scale-90" />
          </div>
        ))}
      </Container>

      {/* Action CTA Button Block: Full span under columns */}
      <div className="md:col-span-2 pt-1">
        <Button
          className="w-full gap-2 font-semibold shadow-md active:scale-[0.99] transition-transform"
          size="lg"
          onClick={() => onPlay({ elo, color, timer, variant, evalBar, threatArrows, suggestionArrows, moveFeedback, engine })}
        >
          <Play className="h-4 w-4 fill-current" /> Play Match
        </Button>
      </div>

    </div>
  );
}

export { TIMER_GROUPS };