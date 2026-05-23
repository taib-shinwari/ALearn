import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

const concepts = [
  { code: "language", labelKey: "language", group: "language" as const },
  { code: "chess",    labelKey: "chess",    group: "other"    as const },
];

export default function ConceptSelectPage() {
  const { setSelectedConcept, interfaceLanguage, setLearningLanguage } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

  const handleSelect = (code: string) => {
    setSelectedConcept(code);
    if (code === "language") {
      const learningLang = interfaceLanguage === "en" ? "nl" : "en";
      setLearningLanguage(learningLang);
    } else {
      setLearningLanguage(interfaceLanguage || "en");
    }
    navigate(`/${code}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-center">{t("selectConcept")}</h2>
        {(["language", "other"] as const).map(group => {
          const items = concepts.filter(c => c.group === group);
          return (
            <div key={group}>
              <h3 className="text-xs uppercase tracking-wider opacity-60 mb-2">
                {group === "language" ? t("language") : t("other")}
              </h3>
              <div className="flex flex-col gap-2">
                {items.map(c => (
                  <Button key={c.code} fullWidth onClick={() => handleSelect(c.code)}>
                    {t(c.labelKey)}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
