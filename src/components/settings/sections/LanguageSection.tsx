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
  const { interfaceLanguage, setInterfaceLanguage } = useApp();
  const { t } = useCourseLanguage();

  // Show every interface language. The interface language is independent of
  // any course/target language, so we no longer hide options that happen to
  // match an existing course.
  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">{t("changeInterfaceLanguage")}</p>
      {LANGS.map(l => {
        const active = interfaceLanguage === l.code;
        return (
          <CardButton
            key={l.code}
            onClick={() => setInterfaceLanguage(l.code)}
            className={active ? "bg-foreground text-background border-border" : ""}
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
