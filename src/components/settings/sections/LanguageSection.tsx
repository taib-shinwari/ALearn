import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { CardButton } from "@/components/ui/card-button";
import { Check } from "lucide-react";

const LANGS: { code: "nl" | "en" | "ar"; native: string }[] = [
  { code: "nl", native: "Nederlands" },
  { code: "en", native: "English" },
  { code: "ar", native: "العربية القرآنية" },
];

export function LanguageSection() {
  const { interfaceLanguage, setInterfaceLanguage, courses } = useApp();
  const { t } = useCourseLanguage();

  // Hide any language that is already a course target — the same language
  // can't be both your interface and something you're learning.
  const usedAsTarget = new Set(courses.map(c => c.toLang));

  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">{t("changeInterfaceLanguage")}</p>
      {LANGS.filter(l => !usedAsTarget.has(l.code) || interfaceLanguage === l.code).map(l => {
        const active = interfaceLanguage === l.code;
        return (
          <CardButton
            key={l.code}
            onClick={() => setInterfaceLanguage(l.code)}
            className={active ? "bg-foreground text-background border-foreground" : ""}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{l.native}</span>
              {active && <Check className="h-4 w-4" />}
            </div>
          </CardButton>
        );
      })}
    </div>
  );
}
