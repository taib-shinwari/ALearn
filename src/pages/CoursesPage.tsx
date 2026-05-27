import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Check } from "lucide-react";
import { useApp, Course } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "العربية القرآنية" },
];

const langLabel = (code: string) =>
  availableLanguages.find(l => l.code === code)?.label || code;

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, learningLanguage, interfaceLanguage, setActiveCourse, addCourse } = useApp();
  const { t } = useCourseLanguage();

  const isActive = (c: Course) =>
    c.fromLang === interfaceLanguage && c.toLang === learningLanguage;

  // The interface language cannot also be the language you're learning.
  const selectable = availableLanguages.filter(l => l.code !== interfaceLanguage);

  const pick = (toLang: string) => {
    const existing = courses.find(c => c.fromLang === interfaceLanguage && c.toLang === toLang);
    if (existing) {
      setActiveCourse(existing);
    } else {
      addCourse({ fromLang: interfaceLanguage!, concept: "language", toLang });
    }
    navigate("/language");
  };

  return (
    <div className="px-6 max-w-2xl mx-auto w-full space-y-4">
      <Container className="py-2">
        <p className="text-xs opacity-70 mb-1">{t("activeCourse")}</p>
        <p className="font-semibold">
          {(learningLanguage && langLabel(learningLanguage)) || "—"}
        </p>
      </Container>

      <p className="text-sm opacity-70">{t("changeCourse")}</p>

      <div className="flex flex-col gap-2">
        {selectable.map(l => {
          const active = l.code === learningLanguage;
          return (
            <Button
              key={l.code}
              fullWidth
              active={active}
              onClick={() => pick(l.code)}
              className="justify-between"
            >
              <span>{l.label}</span>
              {active && <Check className="h-4 w-4" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
