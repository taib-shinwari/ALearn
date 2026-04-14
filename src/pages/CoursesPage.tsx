import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { ArrowLeft, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { interfaceLanguage, learningLanguage, setLearningLanguage } = useApp();

  const courses = [
    {
      category: "Language",
      items: interfaceLanguage === "en"
        ? [{ code: "nl", label: "Nederlands" }]
        : [{ code: "en", label: "English" }],
    },
  ];

  return (
    <div className="min-h-screen pt-16">
      <ScrollNavbar>
        <Button variant="ghost" onClick={() => navigate("/home")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="ghost" size="icon">
          <Plus className="h-5 w-5" />
        </Button>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Select Course</h1>
        {courses.map(cat => (
          <div key={cat.category} className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {cat.category} ({interfaceLanguage === "en" ? "English" : "Nederlands"}) ▾
            </h3>
            {cat.items.map(item => (
              <Button
                key={item.code}
                variant={learningLanguage === item.code ? "default" : "outline"}
                className="w-full mb-2"
                onClick={() => {
                  setLearningLanguage(item.code);
                  navigate("/home");
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
