import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { SupportedLang } from "@/Library/Language";

export default function LanguageIndex() {
  const { langName } = useParams<{ langName: string }>(); 
  const navigate = useNavigate();
  const { t } = useCourseLanguage();
  
  const activeLangName = (langName || "English") as SupportedLang;

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        {/* Dictionary Link Feature */}
        <Button 
          onClick={() => navigate(`/Language/${activeLangName}/Dictionary`)} 
          className="min-h-[64px] py-3 text-base"
        >
          <span className="font-semibold">{t("Dictionary") || "Dictionary"}</span>
        </Button>

        {/* Lessons Link Feature */}
        <Button 
          onClick={() => navigate(`/Language/${activeLangName}/Lessons`)} 
          className="min-h-[64px] py-3 text-base"
        >
          <span className="font-semibold">{t("Lessons") || "Lessons"}</span>
        </Button>
      </div>
    </div>
  );
}