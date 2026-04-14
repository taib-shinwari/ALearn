import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { Settings } from "lucide-react";

export default function HomePage() {
  const { learningLanguage, introductionCompleted } = useApp();
  const navigate = useNavigate();

  const langLabels: Record<string, string> = { nl: "Nederlands", en: "English" };
  const langLabel = langLabels[learningLanguage || ""] || learningLanguage || "Course";

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <Button variant="ghost" onClick={() => navigate("/courses")}>{langLabel}</Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="h-5 w-5" />
        </Button>
      </ScrollNavbar>

      <div className="flex flex-col items-center gap-6 p-6">
        <h1 className="text-2xl font-semibold">Learn {langLabel}</h1>

        {!introductionCompleted ? (
          <Button onClick={() => navigate("/introduction")} className="w-64">
            Start Introduction
          </Button>
        ) : (
          <Button onClick={() => navigate("/lesson")} className="w-64">
            Start
          </Button>
        )}

        {/* Filler content to enable scrolling */}
        <div className="mt-8 space-y-4 w-full max-w-md">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-md">
              <p className="text-muted-foreground">Lesson placeholder {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
