import { useNavigate } from "react-router-dom";
import { CardButton } from "@/Component/UI/card-button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";

export default function RootPicker() {
  const navigate = useNavigate();
  const { uiLang } = useCourseLanguage();

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4">
      <CardButton onClick={() => navigate("/Language")} className="min-h-[64px] py-3 flex items-center justify-center">
        <span className="font-semibold">{LANGUAGE_LABEL[uiLang] || "Language"}</span>
      </CardButton>
      <CardButton onClick={() => navigate("/Chess")} className="min-h-[64px] py-3 flex items-center justify-center">
        <span className="font-semibold">{CHESS_LABEL[uiLang] || "Chess"}</span>
      </CardButton>
    </div>
  );
}