import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useApp, Course } from "@/context/AppContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const availableLanguages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
];

const availableConcepts = [
  { code: "language", label: "Language" },
];

function getLearnableLanguages(fromLang: string) {
  return availableLanguages.filter(l => l.code !== fromLang);
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, learningLanguage, interfaceLanguage, selectedConcept, setActiveCourse, addCourse } = useApp();

  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState(0); // 0=fromLang, 1=concept, 2=toLang
  const [newFromLang, setNewFromLang] = useState<string | null>(null);
  const [newConcept, setNewConcept] = useState<string | null>(null);
  const [addError, setAddError] = useState("");

  const resetAdd = () => {
    setAddStep(0);
    setNewFromLang(null);
    setNewConcept(null);
    setAddError("");
  };

  const handleAddOpen = (open: boolean) => {
    setAddOpen(open);
    if (!open) resetAdd();
  };

  const handleSelectFromLang = (code: string) => {
    setNewFromLang(code);
    setAddStep(1);
  };

  const handleSelectConcept = (code: string) => {
    setNewConcept(code);
    setAddStep(2);
  };

  const handleSelectToLang = (code: string) => {
    const course: Course = { fromLang: newFromLang!, concept: newConcept!, toLang: code };
    const ok = addCourse(course);
    if (!ok) {
      setAddError("This course already exists.");
      return;
    }
    setAddOpen(false);
    resetAdd();
    navigate("/home");
  };

  // Group courses by concept
  const grouped = courses.reduce<Record<string, Course[]>>((acc, c) => {
    const key = c.concept;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const isActive = (c: Course) =>
    c.fromLang === interfaceLanguage && c.concept === selectedConcept && c.toLang === learningLanguage;

  const getLangLabel = (code: string) => availableLanguages.find(l => l.code === code)?.label || code;
  const getConceptLabel = (code: string) => availableConcepts.find(c => c.code === code)?.label || code;

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <Button variant="ghost" onClick={() => navigate("/home")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Dialog open={addOpen} onOpenChange={handleAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {addStep === 0 && "What language do you speak?"}
                {addStep === 1 && "Select concept"}
                {addStep === 2 && "What do you want to learn?"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {addStep === 0 && availableLanguages.map(l => (
                <Button
                  key={l.code}
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSelectFromLang(l.code)}
                >
                  {l.label}
                </Button>
              ))}

              {addStep === 1 && availableConcepts.map(c => (
                <Button
                  key={c.code}
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSelectConcept(c.code)}
                >
                  {c.label}
                </Button>
              ))}

              {addStep === 2 && getLearnableLanguages(newFromLang!).map(l => {
                const alreadyExists = courses.some(c => c.fromLang === newFromLang && c.concept === newConcept && c.toLang === l.code);
                return (
                  <Button
                    key={l.code}
                    variant="outline"
                    className="w-full"
                    disabled={alreadyExists}
                    onClick={() => handleSelectToLang(l.code)}
                  >
                    {l.label} {alreadyExists && "(already added)"}
                  </Button>
                );
              })}

              {addError && <p className="text-sm text-destructive">{addError}</p>}

              {addStep > 0 && (
                <Button variant="ghost" onClick={() => { setAddStep(addStep - 1); setAddError(""); }}>
                  Back
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Your Courses</h1>
        {Object.keys(grouped).length === 0 && (
          <p className="text-muted-foreground">No courses yet. Tap + to add one.</p>
        )}
        {Object.entries(grouped).map(([concept, items]) => (
          <div key={concept} className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {getConceptLabel(concept)}
            </h3>
            {items.map((c, i) => (
              <Button
                key={i}
                variant={isActive(c) ? "default" : "outline"}
                className="w-full mb-2 justify-between"
                onClick={() => {
                  setActiveCourse(c);
                  navigate("/home");
                }}
              >
                <span>{getLangLabel(c.fromLang)} → {getLangLabel(c.toLang)}</span>
                {isActive(c) && <Check className="h-4 w-4 ml-2" />}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
