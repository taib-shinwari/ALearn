import { useApp, Course } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { CardButton } from "@/components/ui/card-button";
import { Container } from "@/components/ui/container";
import { Check } from "lucide-react";

const LANGS: { code: "nl" | "en" | "ar"; native: string }[] = [
  { code: "nl", native: "Nederlands" },
  { code: "en", native: "English" },
  { code: "ar", native: "العربية القرآنية" },
];

export function CourseSection() {
  const { learningLanguage, interfaceLanguage, courses, setActiveCourse, addCourse } = useApp();
  const { t } = useCourseLanguage();

  const pick = (toLang: string) => {
    const existing = courses.find(c => c.fromLang === interfaceLanguage && c.toLang === toLang);
    if (existing) setActiveCourse(existing);
    else addCourse({ fromLang: interfaceLanguage!, concept: "language", toLang } as Course);
  };

  // Cannot learn the language you use as interface.
  const selectable = LANGS.filter(l => l.code !== interfaceLanguage);

  return (
    <div className="space-y-3">
      <Container>
        <p className="text-xs opacity-70 mb-1">{t("activeCourse")}</p>
        <p className="font-semibold">
          {(learningLanguage && (LANGS.find(l => l.code === learningLanguage)?.native ?? learningLanguage)) || "—"}
        </p>
      </Container>

      <p className="text-sm opacity-70">{t("changeCourse")}</p>

      {selectable.map(l => {
        const active = learningLanguage === l.code;
        return (
          <CardButton
            key={l.code}
            onClick={() => pick(l.code)}
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
