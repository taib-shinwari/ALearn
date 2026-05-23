import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { CardButton } from "@/components/ui/card-button";
import { Container } from "@/components/ui/container";
import { Check } from "lucide-react";

const LANG_NAMES: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

export function CourseSection() {
  const { courses, learningLanguage, selectedConcept, setActiveCourse } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <Container>
        <p className="text-xs opacity-70 mb-1">{t("activeCourse")}</p>
        <p className="font-semibold">
          {(learningLanguage && LANG_NAMES[learningLanguage]) || "—"}
        </p>
      </Container>

      <p className="text-sm opacity-70">{t("changeCourse")}</p>

      {courses.length === 0 ? (
        <p className="text-sm opacity-60">{t("noCourses")}</p>
      ) : (
        courses.map((c, i) => {
          const active = c.toLang === learningLanguage && c.concept === selectedConcept;
          return (
            <CardButton
              key={i}
              onClick={() => setActiveCourse(c)}
              className={active ? "bg-foreground text-background border-background" : ""}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {LANG_NAMES[c.toLang] || c.toLang}
                </span>
                {active && <Check className="h-4 w-4" />}
              </div>
            </CardButton>
          );
        })
      )}

      <CardButton onClick={() => navigate("/courses")}>
        + {t("courses")}
      </CardButton>
    </div>
  );
}
