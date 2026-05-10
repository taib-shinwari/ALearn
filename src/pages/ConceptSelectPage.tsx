import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

const concepts = [
  { code: "language", labelKey: "language" },
  { code: "chess", labelKey: "chess" },
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
      // chess: no target language; pick interface language as placeholder
      setLearningLanguage(interfaceLanguage || "en");
    }
    navigate(`/${code}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-center">{t("selectConcept")}</h2>
        {concepts.map(c => (
          <Button key={c.code} fullWidth onClick={() => handleSelect(c.code)}>
            {t(c.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
