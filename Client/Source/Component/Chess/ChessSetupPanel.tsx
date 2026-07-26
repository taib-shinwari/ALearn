import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { Slider } from "@/Component/UI/slider";
import { Switch } from "@/Component/UI/switch";
import { cn } from "@/Library/utils";
import { Play, Crown, Shuffle, Sparkles } from "lucide-react";

export type ColorChoice = "white" | "black" | "random";

export interface TimerPreset {
  id: string;
  label: string;
  baseMs: number;
  incMs: number;
}

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

export const QUICK_TIMERS: TimerPreset[] = [
  { id: "none", label: "No Timer", baseMs: 0, incMs: 0 },
  { id: "1m", label: "1 min", baseMs: 60_000, incMs: 0 },
  { id: "3|2", label: "3 | 2", baseMs: 180_000, incMs: 2_000 },
  { id: "5m", label: "5 min", baseMs: 300_000, incMs: 0 },
  { id: "10m", label: "10 min", baseMs: 600_000, incMs: 0 },
  { id: "15|10", label: "15 | 10", baseMs: 900_000, incMs: 10_000 },
];

interface Props {
  onPlay: (cfg: GameConfig) => void;
  className?: string;
}

export function ChessSetupPanel({ onPlay, className }: Props) {
  const [config, setConfig] = useState<GameConfig>({
    elo: 1500,
    color: "white",
    timer: QUICK_TIMERS[0],
    variant: "standard",
    evalBar: false,
    threatArrows: false,
    suggestionArrows: false,
    moveFeedback: false,
    engine: true,
  });

  const [baseMinutes, setBaseMinutes] = useState<number>(
    Math.floor(config.timer.baseMs / 60_000)
  );
  const [incSeconds, setIncSeconds] = useState<number>(
    Math.floor(config.timer.incMs / 1_000)
  );

  const update = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomTimerChange = (mins: number, incs: number) => {
    setBaseMinutes(mins);
    setIncSeconds(incs);

    if (mins === 0 && incs === 0) {
      update("timer", QUICK_TIMERS[0]);
      return;
    }

    const label = incs > 0 ? `${mins} | ${incs}` : `${mins} min`;
    update("timer", {
      id: "custom",
      label,
      baseMs: mins * 60_000,
      incMs: incs * 1_000,
    });
  };

  const selectPreset = (preset: TimerPreset) => {
    update("timer", preset);
    setBaseMinutes(Math.floor(preset.baseMs / 60_000));
    setIncSeconds(Math.floor(preset.incMs / 1_000));
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-4 select-none p-2", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Engine Rating */}
          <Container className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rating
              </Container>
              <Container className="font-mono font-bold px-2.5 py-0.5 text-xs">
                {config.elo} ELO
              </Container>
            </div>
            <Slider
              min={100}
              max={3200}
              step={100}
              value={[config.elo]}
              onValueChange={([val]) => update("elo", val)}
            />
          </Container>

          {/* Play Side */}
          <Container className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "white", label: "White", icon: <Crown className="w-4 h-4 fill-current" /> },
                { id: "random", label: "Random", icon: <Shuffle className="w-4 h-4" /> },
                { id: "black", label: "Black", icon: <Crown className="w-4 h-4 fill-background" /> },
              ].map((side) => (
                <button
                  key={side.id}
                  type="button"
                  onClick={() => update("color", side.id as ColorChoice)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border text-xs font-semibold transition-all",
                    config.color === side.id
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-input bg-background hover:bg-accent"
                  )}
                >
                  {side.icon}
                  <span>{side.label}</span>
                </button>
              ))}
            </div>
          </Container>

          {/* Variant (No title) */}
          <Container className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update("variant", "standard")}
                className={cn(
                  "py-2.5 px-3 rounded-full border text-center font-semibold text-xs transition-all",
                  config.variant === "standard"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input bg-background hover:bg-accent"
                )}
              >
                Standard
              </button>

              <button
                type="button"
                onClick={() => update("variant", "960")}
                className={cn(
                  "py-2.5 px-3 rounded-full border text-center font-semibold text-xs flex items-center justify-center gap-1.5 transition-all",
                  config.variant === "960"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input bg-background hover:bg-accent"
                )}
              >
                Chess 960 <Sparkles className="w-3 h-3 text-amber-500" />
              </button>
            </div>
          </Container>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Custom Sliders & Quick Timers */}
          <Container className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Minutes Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Minutes
                  </Container>
                  <Container className="font-mono text-xs font-semibold px-2 py-0.5">
                    {baseMinutes}m
                  </Container>
                </div>
                <Slider
                  min={0}
                  max={60}
                  step={1}
                  value={[baseMinutes]}
                  onValueChange={([val]) => handleCustomTimerChange(val, incSeconds)}
                />
              </div>

              {/* Increment Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Increment
                  </Container>
                  <Container className="font-mono text-xs font-semibold px-2 py-0.5">
                    +{incSeconds}s
                  </Container>
                </div>
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={[incSeconds]}
                  onValueChange={([val]) => handleCustomTimerChange(baseMinutes, val)}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {QUICK_TIMERS.map((p) => {
                const isSelected = config.timer.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={cn(
                      "py-2 px-3 rounded-full text-xs font-medium border text-center transition-all truncate",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Container>

          {/* Assists & Aids */}
          <Container className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { key: "evalBar", label: "Eval Bar" },
                { key: "threatArrows", label: "Threat Arrows" },
                { key: "suggestionArrows", label: "Suggestions" },
                { key: "moveFeedback", label: "Move Feedback" },
                { key: "engine", label: "Engine Assist" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Switch
                    checked={Boolean(config[key as keyof GameConfig])}
                    onCheckedChange={(val) => update(key as keyof GameConfig, val)}
                    className="scale-85 origin-right"
                  />
                </div>
              ))}
            </div>
          </Container>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        className="w-full gap-2 font-semibold shadow-xs py-5 text-base rounded-full active:scale-[0.99] transition-transform mt-2"
        size="lg"
        onClick={() => onPlay(config)}
      >
        <Play className="h-5 w-5 fill-current" /> Play Match
      </Button>
    </div>
  );
}