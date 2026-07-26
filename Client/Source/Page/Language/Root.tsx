import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
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
    <div className="px-4 w-full">
      {hasActiveLanguages ? (
        /* Clean Active View (No titles, just the active track buttons) */
        <div className="grid grid-cols-2 gap-3">
          {activeLanguages.map((lang) => (
            <Button
              key={lang}
              onClick={() => handlePick(lang)}
              className="min-h-[64px] py-3 text-base"
            >
              <span className="font-semibold">{lang}</span>
            </Button>
          ))}
        </div>
      ) : (
        /* Clean Empty State View (Just the grid of available choices) */
        <div className="grid grid-cols-2 gap-3">
          {inactiveLanguages.map((lang) => (
            <Button
              key={lang}
              onClick={() => handlePick(lang)}
              className="min-h-[64px] py-3 text-base"
            >
              <span className="font-semibold">{lang}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}