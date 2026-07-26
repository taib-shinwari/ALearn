import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";

export default function RootPicker() {
  const navigate = useNavigate();
  const { uiLang } = useCourseLanguage();

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4">
      <Button
        onClick={() => navigate("/Language")}
        className="min-h-[64px] py-3 rounded-full flex items-center justify-center text-base"
      >
        <span className="font-semibold">{LANGUAGE_LABEL[uiLang] || "Language"}</span>
      </Button>

      <Button
        onClick={() => navigate("/Chess")}
        className="min-h-[64px] py-3 rounded-full flex items-center justify-center text-base"
      >
        <span className="font-semibold">{CHESS_LABEL[uiLang] || "Chess"}</span>
      </Button>
    </div>
  );
}