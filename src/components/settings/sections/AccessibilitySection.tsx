import { useApp, TextSize } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { CardButton } from "@/components/ui/card-button";
import { Check } from "lucide-react";

const SIZES: { id: TextSize; labelKey: string }[] = [
  { id: "sm", labelKey: "textSizeSmall" },
  { id: "md", labelKey: "textSizeMedium" },
  { id: "lg", labelKey: "textSizeLarge" },
];

export function AccessibilitySection() {
  const { textSize, setTextSize, highContrast, setHighContrast } = useApp();
  const { t } = useCourseLanguage();
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">{t("textSize")}</h3>
        <div className="space-y-2">
          {SIZES.map(s => {
            const active = textSize === s.id;
            return (
              <CardButton
                key={s.id}
                onClick={() => setTextSize(s.id)}
                className={active ? "bg-foreground text-background border-background" : ""}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t(s.labelKey)}</span>
                  {active && <Check className="h-4 w-4" />}
                </div>
              </CardButton>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">{t("highContrast")}</h3>
        <CardButton
          onClick={() => setHighContrast(!highContrast)}
          className={highContrast ? "bg-foreground text-background border-background" : ""}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t("highContrast")}</div>
              <div className="text-xs opacity-70 mt-1">{t("highContrastDesc")}</div>
            </div>
            {highContrast && <Check className="h-4 w-4 shrink-0" />}
          </div>
        </CardButton>
      </section>
    </div>
  );
}
