import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Plus, Check, ArrowLeft } from "lucide-react";
import { useApp, Course } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useState } from "react";

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "العربية" },
];

const availableConcepts = [
  { code: "language", labelKey: "language" },
];

function getLearnableLanguages(fromLang: string) {
  // For now words only exist in nl/en, so target must be nl/en and != fromLang
  return availableLanguages.filter(l => l.code !== fromLang && (l.code === "nl" || l.code === "en"));
}

const langLabel = (code: string) =>
  availableLanguages.find(l => l.code === code)?.label || code;

type Mode = "list" | "create";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, learningLanguage, interfaceLanguage, selectedConcept, setActiveCourse, addCourse } = useApp();
  const { t } = useCourseLanguage();

  const [mode, setMode] = useState<Mode>("list");
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: from-lang, 1: concept, 2: to-lang
  const [newFrom, setNewFrom] = useState<string | null>(null);
  const [newConcept, setNewConcept] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isActive = (c: Course) =>
    c.fromLang === interfaceLanguage && c.concept === selectedConcept && c.toLang === learningLanguage;

  const startCreate = () => {
    setMode("create");
    setStep(0);
    setNewFrom(null);
    setNewConcept(null);
    setError("");
  };

  const cancelCreate = () => {
    setMode("list");
    setStep(0);
    setNewFrom(null);
    setNewConcept(null);
    setError("");
  };

  const goBackStep = () => {
    setError("");
    if (step === 0) cancelCreate();
    else setStep((step - 1) as 0 | 1);
  };

  const handleSelectFrom = (code: string) => { setNewFrom(code); setStep(1); };
  const handleSelectConcept = (code: string) => { setNewConcept(code); setStep(2); };
  const handleSelectTo = (code: string) => {
    const course: Course = { fromLang: newFrom!, concept: newConcept!, toLang: code };
    const ok = addCourse(course);
    if (!ok) {
      setError(t("alreadyAdded"));
      return;
    }
    setMode("list");
    navigate(`/${course.concept}`);
  };

  // Internal breadcrumb (Courses-page-local) for create flow
  const localCrumbs: string[] = [];
  if (mode === "create") {
    if (newFrom) localCrumbs.push(langLabel(newFrom));
    if (newConcept) {
      const c = availableConcepts.find(x => x.code === newConcept);
      localCrumbs.push(c ? t(c.labelKey) : newConcept);
    }
  }

  return (
    <div className="px-6 max-w-md mx-auto">
      {/* Header row: title + add button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t("yourCourses")}</h1>
        {mode === "list" ? (
          <Button size="icon" onClick={startCreate} aria-label={t("create")}>
            <Plus className="h-5 w-5" />
          </Button>
        ) : (
          <Button size="icon" onClick={goBackStep} aria-label={t("back")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {mode === "list" && (
        <>
          {/* Thin container of active courses */}
          {courses.length === 0 ? (
            <Container className="py-2">
              <p className="text-sm">{t("noCourses")}</p>
            </Container>
          ) : (
            <Container className="py-2">
              <ul className="divide-y divide-black">
                {courses.map((c, i) => (
                  <li
                    key={i}
                    onClick={() => { setActiveCourse(c); navigate(`/${c.concept}`); }}
                    className={`flex items-center justify-between py-2 cursor-pointer ${isActive(c) ? "font-semibold" : ""}`}
                  >
                    <span className="text-sm">
                      {langLabel(c.fromLang)} → {langLabel(c.toLang)}
                    </span>
                    {isActive(c) && <Check className="h-4 w-4" />}
                  </li>
                ))}
              </ul>
            </Container>
          )}
        </>
      )}

      {mode === "create" && (
        <>
          {/* Local breadcrumb for create flow */}
          {localCrumbs.length > 0 && (
            <div className="text-sm mb-3">
              {localCrumbs.map((c, i) => (
                <span key={i}>{c}<span className="px-1">/</span></span>
              ))}
            </div>
          )}

          {step === 0 && (
            <>
              <h2 className="text-sm font-medium mb-3">{t("interfaceLanguage")}</h2>
              <div className="flex flex-col gap-2">
                {availableLanguages.map(l => (
                  <Button key={l.code} fullWidth onClick={() => handleSelectFrom(l.code)}>
                    {l.label}
                  </Button>
                ))}
              </div>
            </>
          )}

          {step === 1 && newFrom && (
            <>
              <h2 className="text-sm font-medium mb-3">{t("selectConceptShort")}</h2>
              <div className="flex flex-col gap-2">
                {availableConcepts
                  .filter(c => courses.some(co => co.fromLang === newFrom && co.concept === c.code) || true)
                  .map(c => (
                    <Button key={c.code} fullWidth onClick={() => handleSelectConcept(c.code)}>
                      {t(c.labelKey)}
                    </Button>
                  ))}
              </div>
            </>
          )}

          {step === 2 && newFrom && newConcept && (
            <>
              <h2 className="text-sm font-medium mb-3">{t("selectCourse")}</h2>
              <div className="flex flex-col gap-2">
                {getLearnableLanguages(newFrom).map(l => {
                  const exists = courses.some(c => c.fromLang === newFrom && c.concept === newConcept && c.toLang === l.code);
                  return (
                    <Button key={l.code} fullWidth disabled={exists} onClick={() => handleSelectTo(l.code)}>
                      {l.label} {exists && t("alreadyAdded")}
                    </Button>
                  );
                })}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}
