import { useParams, useNavigate } from "react-router-dom";
import { CardButton } from "@/Component/UI/card-button";
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
        <CardButton 
          onClick={() => navigate(`/Language/${activeLangName}/Dictionary`)} 
          className="rounded-full bg-background border border-border text-foreground p-4 text-center transition-colors duration-200 hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none min-h-[64px] py-3 flex items-center justify-center text-base"
        >
          <span className="font-semibold">{t("Dictionary") || "Dictionary"}</span>
        </CardButton>

        {/* Lessons Link Feature */}
        <CardButton 
          onClick={() => navigate(`/Language/${activeLangName}/Lessons`)} 
          className="rounded-full bg-background border border-border text-foreground p-4 text-center transition-colors duration-200 hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none min-h-[64px] py-3 flex items-center justify-center text-base"
        >
          <span className="font-semibold">{t("Lessons") || "Lessons"}</span>
        </CardButton>
      </div>
    </div>
  );
}