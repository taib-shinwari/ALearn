import { useChessSettings, type InputMode } from "Client/Library/chessSettings";
import { Container } from "Client/Component/UI/container";
import { TitleBar } from "Client/Component/UI/title-bar";
import { Switch } from "Client/Component/UI/switch";
import { Slider } from "Client/Component/UI/slider";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { cn } from "Client/Library/utils";

export function ChessSection() {
  const [s, set] = useChessSettings();
  const { uiLang } = useCourseLanguage();

  // Helper function to safely pull translated copy based on uiLang key fallback to English
  const tr = (dict: Record<string, string>) => dict[uiLang] || dict["en"];

  return (
    <div className="space-y-4">
      <TitleBar>
        {tr({ nl: "Schaken", en: "Chess", ar: "الشطرنج" })}
      </TitleBar>

      {/* Input Selection */}
      <Container className="space-y-2">
        <p className="text-sm font-medium">
          {tr({ nl: "Invoer", en: "Input", ar: "الإدخال" })}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["click", "drag", "both"] as InputMode[]).map(m => (
            <button
              key={m}
              onClick={() => set({ inputMode: m })}
              className={cn(
                "px-3 py-2 rounded-[10px] border-2 border-border text-xs font-medium transition-colors",
                s.inputMode === m ? "bg-foreground text-background" : "bg-background hover:bg-muted"
              )}
            >
              {m === "click" && tr({ nl: "Klik", en: "Click", ar: "نقر" })}
              {m === "drag" && tr({ nl: "Slepen", en: "Drag", ar: "سحب" })}
              {m === "both" && tr({ nl: "Beide", en: "Both", ar: "كلاهما" })}
            </button>
          ))}
        </div>
      </Container>

      {/* Premoves Option */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Pre-zetten toestaan", en: "Allow premoves", ar: "السماح بالحركات المسبقة" })}
          </p>
          <p className="text-xs opacity-60">
            {tr({ nl: "Plan een zet voor je beurt.", en: "Plan a move before your turn.", ar: "" })}
          </p>
        </div>
        <Switch checked={s.allowPremove} onCheckedChange={v => set({ allowPremove: v })} />
      </Container>

      {/* Piece Animations Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Animatie", en: "Animate pieces", ar: "حركة القطع" })}
          </p>
        </div>
        <Switch checked={s.animatePieces} onCheckedChange={v => set({ animatePieces: v })} />
      </Container>

      {/* Animation Speed Slider */}
      <Container className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {tr({ nl: "Animatiesnelheid", en: "Animation speed", ar: "سرعة الحركة" })}
          </p>
          <span className="text-xs opacity-60 font-mono">{s.animationSpeed} ms</span>
        </div>
        <Slider
          min={50}
          max={600}
          step={10}
          value={[s.animationSpeed]}
          onValueChange={v => set({ animationSpeed: v[0] })}
          disabled={!s.animatePieces}
        />
      </Container>

      {/* Move Hints Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Hints tonen", en: "Show hints", ar: "إظهار التلميحات" })}
          </p>
        </div>
        <Switch checked={s.showHints} onCheckedChange={v => set({ showHints: v })} />
      </Container>

      {/* Audio Narration Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Spraakuitleg", en: "Speak narration", ar: "نطق الشرح" })}
          </p>
          <p className="text-xs opacity-60">
            {tr({ nl: "Lees lesuitleg hardop voor.", en: "Read lesson narration aloud.", ar: "" })}
          </p>
        </div>
        <Switch checked={s.speakNarration} onCheckedChange={v => set({ speakNarration: v })} />
      </Container>
    </div>
  );
}