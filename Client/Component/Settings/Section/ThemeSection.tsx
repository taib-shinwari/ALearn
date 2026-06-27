import { useApp, ThemeChoice } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { CardButton } from "Client/Component/UI/card-button";
import { Check, Sun, Moon, Laptop } from "lucide-react";

const OPTIONS: { id: ThemeChoice; labelKey: string; Icon: any }[] = [
  { id: "light",  labelKey: "themeLight",  Icon: Sun },
  { id: "dark",   labelKey: "themeDark",   Icon: Moon },
  { id: "system", labelKey: "themeSystem", Icon: Laptop },
];

export function ThemeSection() {
  const { theme, setTheme } = useApp();
  const { t } = useCourseLanguage();
  return (
    <div className="space-y-3">
      {OPTIONS.map(({ id, labelKey, Icon }) => {
        const active = theme === id;
        return (
          <CardButton
            key={id}
            onClick={() => setTheme(id)}
            className={active ? "bg-foreground text-background border-background" : ""}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="h-4 w-4" /> {t(labelKey)}
              </span>
              {active && <Check className="h-4 w-4" />}
            </div>
          </CardButton>
        );
      })}
    </div>
  );
}
