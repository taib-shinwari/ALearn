import { useNavigate, useParams } from "react-router-dom";
import { CardButton } from "@/Component/UI/card-button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";

export default function DictionaryRoot() {
  const navigate = useNavigate();
  const { langName } = useParams<{ langName: string }>();
  const { t } = useCourseLanguage();

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        <CardButton 
          onClick={() => navigate(`/Language/${langName}/Dictionary/Vocabulary`)} 
          className="rounded-full bg-background border border-border text-foreground p-4 text-center transition-colors duration-200 hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none min-h-[64px] py-3 flex items-center justify-center text-base"
        >
          <span className="font-semibold">{t("Vocabulary") || "Vocabulary"}</span>
        </CardButton>
      </div>
    </div>
  );
}