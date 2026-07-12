import { useNavigate } from "react-router-dom";
import { CardButton } from "@/Component/UI/card-button";
import { useApp } from "@/Context/App";

export default function LanguageRoot() {
  const navigate = useNavigate();
  const { 
    setLearningLanguage, 
    activeLanguages, 
    inactiveLanguages 
  } = useApp();

  const handlePick = (name: string) => {
    setLearningLanguage(name);
    navigate(`/Language/${name}`);
  };

  const hasActiveLanguages = activeLanguages.length > 0;

  return (
    <div className="px-4 space-y-4 w-full">
      {/* 1. Active Languages Section */}
      {hasActiveLanguages && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Active Track
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {activeLanguages.map((lang) => (
              <CardButton
                key={lang}
                onClick={() => handlePick(lang)}
                className="min-h-[64px] py-3 flex items-center justify-center border-primary"
              >
                <span className="font-semibold text-primary">{lang}</span>
              </CardButton>
            ))}
          </div>
        </div>
      )}

      {/* 2. Inactive / Add Languages Section */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Add Language:
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {inactiveLanguages.map((lang) => (
            <CardButton
              key={lang}
              onClick={() => handlePick(lang)}
              className="min-h-[64px] py-3 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <span className="font-semibold">{lang}</span>
            </CardButton>
          ))}
        </div>
      </div>
    </div>
  );
}