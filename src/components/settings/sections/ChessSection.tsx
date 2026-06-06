import { useChessSettings } from "@/lib/chessSettings";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export function ChessSection() {
  const [s, set] = useChessSettings();
  const { uiLang } = useCourseLanguage();

  const tr = (nl: string, en: string, ar: string) =>
    uiLang === "nl" ? nl : uiLang === "ar" ? ar : en;

  return (
    <div className="space-y-4">
      <TitleBar>{tr("Schaken", "Chess", "الشطرنج")}</TitleBar>

      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{tr("Pre-zetten toestaan", "Allow premoves", "السماح بالحركات المسبقة")}</p>
          <p className="text-xs opacity-60">{tr("Plan een zet voor je beurt.", "Plan a move before your turn.", "")}</p>
        </div>
        <Switch checked={s.allowPremove} onCheckedChange={v => set({ allowPremove: v })} />
      </Container>

      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{tr("Animatie", "Animate pieces", "حركة القطع")}</p>
        </div>
        <Switch checked={s.animatePieces} onCheckedChange={v => set({ animatePieces: v })} />
      </Container>

      <Container className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{tr("Animatiesnelheid", "Animation speed", "سرعة الحركة")}</p>
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

      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{tr("Hints tonen", "Show hints", "إظهار التلميحات")}</p>
        </div>
        <Switch checked={s.showHints} onCheckedChange={v => set({ showHints: v })} />
      </Container>

      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{tr("Spraakuitleg", "Speak narration", "نطق الشرح")}</p>
          <p className="text-xs opacity-60">{tr("Lees lesuitleg hardop voor.", "Read lesson narration aloud.", "")}</p>
        </div>
        <Switch checked={s.speakNarration} onCheckedChange={v => set({ speakNarration: v })} />
      </Container>
    </div>
  );
}
