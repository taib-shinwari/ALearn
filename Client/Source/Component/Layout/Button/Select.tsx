// @/Component/Header/Select.tsx
import { CheckSquare, X } from "lucide-react";
import { useApp } from "@/Context/App";

export function SelectButton() {
  // Safe extraction of global states from useApp
  const context = useApp();
  const selectMode = context.selectMode || false;
  const setSelectMode = context.setSelectMode || (() => {});
  const setSelected = context.setSelected || (() => {});

  const handleToggleSelect = () => {
    if (typeof setSelectMode === "function") {
      setSelectMode(!selectMode);
    }
    // Clear selection buffer when toggling selection mode state
    if (typeof setSelected === "function") {
      setSelected(new Set<string>());
    }
  };

  return (
    <button 
      type="button"
      onClick={handleToggleSelect} 
      className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors bg-background hover:bg-foreground hover:text-background"
      aria-label={selectMode ? "Cancel selection" : "Select words"}
    >
      {selectMode ? (
        <X className="h-5 w-5" />
      ) : (
        <CheckSquare className="h-5 w-5" />
      )}
    </button>
  );
}