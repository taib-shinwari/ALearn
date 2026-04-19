import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { CardButton } from "@/components/ui/card-button";
import { Check } from "lucide-react";

const LANGS: { code: "nl" | "en" | "ar"; native: string; en: string }[] = [
  { code: "nl", native: "Nederlands", en: "Dutch" },
  { code: "en", native: "English",    en: "English" },
  { code: "ar", native: "العربية",     en: "Arabic" },
];

export function LanguageSection() {
  const { interfaceLanguage, setInterfaceLanguage } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">{t("changeInterfaceLanguage")}</p>
      {LANGS.map(l => {
        const active = interfaceLanguage === l.code;
        return (
          <CardButton
            key={l.code}
            onClick={() => { setInterfaceLanguage(l.code); navigate(0 as any); }}
            className={active ? "bg-black text-white border-white" : ""}
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
