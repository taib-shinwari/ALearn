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
  { code: "ar", label: "العربية" },
];

const availableConcepts = [
  { code: "language", labelKey: "language" },
];

function getLearnableLanguages(fromLang: string) {
  // Words exist only in nl/en, target must differ from interface language
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

  // List view: filter visible items based on chosen interface language + concept.
  // We also derive a top breadcrumb showing the current navigation depth.
  const [listFromLang, setListFromLang] = useState<string | null>(interfaceLanguage);
  const [listConcept, setListConcept] = useState<string | null>(selectedConcept);

  // Reset list-mode breadcrumb when entering list mode fresh
  const resetList = () => {
    setListFromLang(interfaceLanguage);
    setListConcept(selectedConcept);
  };

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
    resetList();
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

  // ----- LIST MODE: drill-down by interfaceLang -> concept -> course -----
  const interfaceLanguagesWithCourses = useMemo(() => {
    const set = new Set(courses.map(c => c.fromLang));
    return availableLanguages.filter(l => set.has(l.code));
  }, [courses]);

  const conceptsForListLang = useMemo(() => {
    if (!listFromLang) return [];
    const set = new Set(courses.filter(c => c.fromLang === listFromLang).map(c => c.concept));
    return availableConcepts.filter(c => set.has(c.code));
  }, [courses, listFromLang]);

  const coursesForListSelection = useMemo(() => {
    if (!listFromLang || !listConcept) return [];
    return courses.filter(c => c.fromLang === listFromLang && c.concept === listConcept);
  }, [courses, listFromLang, listConcept]);

  // Top breadcrumb segments (above the title) for list mode.
  // Each segment is interactive: clicking it navigates back to that drill level.
  interface Crumb { label: string; onClick?: () => void }
  const listCrumbs: Crumb[] = [];
  if (mode === "list") {
    if (listFromLang) {
      listCrumbs.push({
        label: langLabel(listFromLang),
        onClick: listConcept ? () => setListConcept(null) : undefined,
      });
    }
    if (listConcept) {
      const c = availableConcepts.find(x => x.code === listConcept);
      listCrumbs.push({ label: c ? t(c.labelKey) : listConcept });
    }
  } else {
    if (newFrom) {
      listCrumbs.push({
        label: langLabel(newFrom),
        onClick: step > 0 ? () => { setStep(0); setNewConcept(null); } : undefined,
      });
    }
    if (newConcept) {
      const c = availableConcepts.find(x => x.code === newConcept);
      listCrumbs.push({
        label: c ? t(c.labelKey) : newConcept,
        onClick: step > 1 ? () => setStep(1) : undefined,
      });
    }
  }

  const drillBack = () => {
    if (listConcept) { setListConcept(null); return; }
    if (listFromLang) { setListFromLang(null); return; }
  };

  const showListBack = mode === "list" && (listFromLang || listConcept);

  return (
    <div className="px-6 max-w-md mx-auto">
      {/* Top breadcrumb (thin container, sized to content, interactive) */}
      {listCrumbs.length > 0 && (
        <nav aria-label="courses-breadcrumb" className="mb-3">
          <TitleBar>
            <ol className="flex flex-wrap items-center gap-1">
              {listCrumbs.map((c, i) => {
                const isLast = i === listCrumbs.length - 1;
                return (
                  <li key={i} className="flex items-center gap-1">
                    {c.onClick && !isLast ? (
                      <button
                        type="button"
                        onClick={c.onClick}
                        className="hover:underline cursor-pointer"
                      >
                        {c.label}
                      </button>
                    ) : (
                      <span className={isLast ? "font-medium" : ""}>{c.label}</span>
                    )}
                    <span className="px-1">/</span>
                  </li>
                );
              })}
            </ol>
          </TitleBar>
        </nav>
      )}

      {/* Title row: thin TitleBar sized to content + actions on the right */}
      <div className="flex items-center gap-2 mb-4">
        <TitleBar className="font-semibold">
          {mode === "list" ? t("yourCourses") : t("create")}
        </TitleBar>
        <div className="flex items-center gap-2 ml-auto">
          {mode === "list" ? (
            <>
              {showListBack && (
                <Button size="icon" onClick={drillBack} aria-label={t("back")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Button size="icon" onClick={startCreate} aria-label={t("create")}>
                <Plus className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button size="icon" onClick={goBackStep} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* LIST MODE */}
      {mode === "list" && (
        <>
          {courses.length === 0 ? (
            <Container className="py-2">
              <p className="text-sm">{t("noCourses")}</p>
            </Container>
          ) : !listFromLang ? (
            // Step A: pick interface language (only those with active courses)
            <div className="flex flex-col gap-2">
              {interfaceLanguagesWithCourses.map(l => (
                <Button key={l.code} fullWidth onClick={() => setListFromLang(l.code)}>
                  {l.label}
                </Button>
              ))}
            </div>
          ) : !listConcept ? (
            // Step B: pick concept (only those with courses for this interface lang)
            <div className="flex flex-col gap-2">
              {conceptsForListLang.map(c => (
                <Button key={c.code} fullWidth onClick={() => setListConcept(c.code)}>
                  {t(c.labelKey)}
                </Button>
              ))}
            </div>
          ) : (
            // Step C: list courses (toLang only); active = black bg + checkmark
            <div className="flex flex-col gap-2">
              {coursesForListSelection.map((c, i) => {
                const active = isActive(c);
                return (
                  <Button
                    key={i}
                    fullWidth
                    active={active}
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

      {/* CREATE MODE */}
      {mode === "create" && (
        <>
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
                {availableConcepts.map(c => (
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
