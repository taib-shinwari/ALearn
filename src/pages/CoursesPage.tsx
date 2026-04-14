import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollNavbar from "@/components/ScrollNavbar";
import { ArrowLeft, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { interfaceLanguage, learningLanguage, setLearningLanguage } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [newCourse, setNewCourse] = useState("");

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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Course name..."
                value={newCourse}
                onChange={e => setNewCourse(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Custom courses coming soon. Stay tuned!
              </p>
              <Button onClick={() => setAddOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </ScrollNavbar>

      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Select Course</h1>
        {courses.map(cat => (
          <div key={cat.category} className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {cat.category}
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
