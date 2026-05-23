import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { Plus, Check, ArrowLeft } from "lucide-react";
import { useApp, Course } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { useState, useMemo } from "react";

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "العربية القرآنية" },
];

const availableConcepts = [
  { code: "language", labelKey: "language", group: "language" as const },
  { code: "chess",    labelKey: "chess",    group: "other"    as const },
];

function getLearnableLanguages(fromLang: string) {
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
  const [step, setStep] = useState<0 | 1>(0); // 0: concept, 1: to-lang
  const [newConcept, setNewConcept] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isActive = (c: Course) =>
    c.fromLang === interfaceLanguage && c.concept === selectedConcept && c.toLang === learningLanguage;

  // List view filters by current interface language (no drill).
  const [listConcept, setListConcept] = useState<string | null>(selectedConcept);

  const startCreate = () => {
    setMode("create");
    setStep(0);
    setNewConcept(null);
    setError("");
  };

  const cancelCreate = () => {
    setMode("list");
    setStep(0);
    setNewConcept(null);
    setError("");
    setListConcept(selectedConcept);
  };

  const goBackStep = () => {
    setError("");
    if (step === 0) cancelCreate();
    else setStep(0);
  };

  const handleSelectConcept = (code: string) => {
    if (code === "chess") {
      // Chess has no target language — create directly under current interface lang
      const course: Course = { fromLang: interfaceLanguage!, concept: "chess", toLang: interfaceLanguage! };
      const ok = addCourse(course);
      if (!ok && courses.some(c => c.concept === "chess" && c.fromLang === interfaceLanguage)) {
        setActiveCourse(course);
      }
      setMode("list");
      navigate(`/chess`);
      return;
    }
    setNewConcept(code);
    setStep(1);
  };

  const handleSelectTo = (code: string) => {
    const course: Course = { fromLang: interfaceLanguage!, concept: newConcept!, toLang: code };
    const ok = addCourse(course);
    if (!ok) { setError(t("alreadyAdded")); return; }
    setMode("list");
    navigate(`/${course.concept}`);
  };

  // ----- LIST MODE -----
  const conceptsForList = useMemo(() => {
    const set = new Set(courses.filter(c => c.fromLang === interfaceLanguage).map(c => c.concept));
    return availableConcepts.filter(c => set.has(c.code));
  }, [courses, interfaceLanguage]);

  const coursesForListSelection = useMemo(() => {
    if (!listConcept) return [];
    return courses.filter(c => c.fromLang === interfaceLanguage && c.concept === listConcept);
  }, [courses, interfaceLanguage, listConcept]);

  // Breadcrumb segments — interface language is NEVER shown here
  interface Crumb { label: string; onClick?: () => void }
  const listCrumbs: Crumb[] = [];
  if (mode === "list") {
    if (listConcept) {
      const c = availableConcepts.find(x => x.code === listConcept);
      listCrumbs.push({ label: c ? t(c.labelKey) : listConcept });
    }
  } else {
    if (newConcept) {
      const c = availableConcepts.find(x => x.code === newConcept);
      listCrumbs.push({
        label: c ? t(c.labelKey) : newConcept,
        onClick: step > 0 ? () => setStep(0) : undefined,
      });
    }
  }

  const drillBack = () => { if (listConcept) setListConcept(null); };
  const showListBack = mode === "list" && !!listConcept;

  // For chess concept selection in list mode — clicking goes straight to /chess
  const onPickListConcept = (code: string) => {
    if (code === "chess") {
      const course = courses.find(c => c.fromLang === interfaceLanguage && c.concept === "chess");
      if (course) setActiveCourse(course);
      navigate("/chess");
      return;
    }
    setListConcept(code);
  };

  return (
    <div className="px-6 max-w-3xl mx-auto w-full">
      {listCrumbs.length > 0 && (
        <nav aria-label="courses-breadcrumb" className="mb-3">
          <TitleBar>
            <ol className="flex flex-wrap items-center gap-1">
              {listCrumbs.map((c, i) => {
                const isLast = i === listCrumbs.length - 1;
                return (
                  <li key={i} className="flex items-center gap-1">
                    {c.onClick && !isLast ? (
                      <button type="button" onClick={c.onClick} className="hover:underline cursor-pointer">{c.label}</button>
                    ) : (
                      <span className={isLast ? "font-medium" : ""}>{c.label}</span>
                    )}
                    {!isLast && <span className="px-1">/</span>}
                  </li>
                );
              })}
            </ol>
          </TitleBar>
        </nav>
      )}

      <div className="flex items-center gap-2 mb-4 justify-end">
        {mode === "list" ? (
          <>
            {showListBack && (
              <Button size="icon" onClick={drillBack} aria-label={t("back")}><ArrowLeft className="h-5 w-5" /></Button>
            )}
            <Button size="icon" onClick={startCreate} aria-label={t("create")}><Plus className="h-5 w-5" /></Button>
          </>
        ) : (
          <Button size="icon" onClick={goBackStep} aria-label={t("back")}><ArrowLeft className="h-5 w-5" /></Button>
        )}
      </div>

      {/* LIST MODE */}
      {mode === "list" && (
        <>
          {courses.length === 0 ? (
            <Container className="py-2"><p className="text-sm">{t("noCourses")}</p></Container>
          ) : !listConcept ? (
            // Step A: concepts grouped (Language / Other)
            <div className="space-y-5">
              {(["language", "other"] as const).map(group => {
                const items = conceptsForList.filter(c => c.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <h3 className="text-xs uppercase tracking-wider opacity-60 mb-2">
                      {group === "language" ? t("language") : t("other")}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {items.map(c => (
                        <Button key={c.code} fullWidth onClick={() => onPickListConcept(c.code)}>
                          {t(c.labelKey)}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {coursesForListSelection.map((c, i) => {
                const active = isActive(c);
                return (
                  <Button
                    key={i} fullWidth active={active}
                    onClick={() => { setActiveCourse(c); navigate(`/${c.concept}`); }}
                    className="justify-between"
                  >
                    <span>{langLabel(c.toLang)}</span>
                    {active && <Check className="h-4 w-4" />}
                  </Button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE MODE — interface language is implicit (current setting) */}
      {mode === "create" && (
        <>
          {step === 0 && (
            <>
              <h2 className="text-sm font-medium mb-3">{t("selectConceptShort")}</h2>
              <div className="space-y-5">
                {(["language", "other"] as const).map(group => {
                  const items = availableConcepts.filter(c => c.group === group);
                  return (
                    <div key={group}>
                      <h3 className="text-xs uppercase tracking-wider opacity-60 mb-2">
                        {group === "language" ? t("language") : t("other")}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {items.map(c => (
                          <Button key={c.code} fullWidth onClick={() => handleSelectConcept(c.code)}>
                            {t(c.labelKey)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && newConcept && (
            <>
              <h2 className="text-sm font-medium mb-3">{t("selectCourse")}</h2>
              <div className="flex flex-col gap-2">
                {getLearnableLanguages(interfaceLanguage!).map(l => {
                  const exists = courses.some(c => c.fromLang === interfaceLanguage && c.concept === newConcept && c.toLang === l.code);
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
