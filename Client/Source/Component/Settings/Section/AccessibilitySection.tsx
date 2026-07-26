import { useApp, TextSize } from "@/Context/App";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { Button } from "@/Component/UI/Button";
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
          {SIZES.map((s) => {
            const active = textSize === s.id;
            return (
              <Button
                key={s.id}
                active={active} // Pass active state directly!
                onClick={() => setTextSize(s.id)}
                className="w-full rounded-2xl p-4 text-left justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{t(s.labelKey)}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </div>
              </Button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">{t("highContrast")}</h3>
        <Button
          active={highContrast} // Pass active state directly!
          onClick={() => setHighContrast(!highContrast)}
          className="w-full rounded-2xl p-4 text-left justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="font-medium">{t("highContrast")}</div>
              <div className="text-xs opacity-70 group-hover:opacity-100 transition-opacity mt-1">
                {t("highContrastDesc")}
              </div>
            </div>
            {highContrast && <Check className="h-4 w-4 shrink-0" />}
          </div>
        </Button>
      </section>
    </div>
  );
}