import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ConceptSelectPage() {
  const { setSelectedConcept, interfaceLanguage, setLearningLanguage } = useApp();
  const navigate = useNavigate();

  const handleSelect = () => {
    setSelectedConcept("language");
    // Auto-set learning language based on interface language
    const learningLang = interfaceLanguage === "en" ? "nl" : "en";
    setLearningLanguage(learningLang);
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h2 className="text-xl font-semibold text-center">Select a Concept</h2>
        <Button onClick={handleSelect} className="w-full">Language</Button>
      </div>
    </div>
  );
}
