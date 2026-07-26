import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";

export default function DictionaryRoot() {
  const navigate = useNavigate();
  const { langName } = useParams<{ langName: string }>();
  const { t } = useCourseLanguage();

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => navigate(`/Language/${langName}/Dictionary/Vocabulary`)} 
          className="min-h-[64px] py-3 text-base"
        >
          <span className="font-semibold">{t("Vocabulary") || "Vocabulary"}</span>
        </Button>
      </div>
    </div>
  );
}