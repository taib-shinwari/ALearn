import { useParams } from "react-router-dom";
import { LessonsView } from "@/Component/Lesson/Lesson";
import { SupportedLang } from "@/Library/Language";

export default function LessonPage() {
  const { langName } = useParams<{ langName: string }>();
  
  // Safely cast the URL string parameter directly into our supported language names type
  const activeLangName = (langName || "English") as SupportedLang;

  return <LessonsView lang={activeLangName} />;
}