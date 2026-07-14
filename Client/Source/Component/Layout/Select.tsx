// @/Component/Header/Select.tsx
import { CheckSquare, X } from "lucide-react";
import { useApp } from "@/Context/App";
import { Button } from "@/Component/UI/Button";

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
    <Button 
      type="button"
      onClick={handleToggleSelect} 
      active={selectMode}
      size="icon"
      className="h-10 w-10 rounded-full p-0 transition-colors border border-border"
      aria-label={selectMode ? "Cancel selection" : "Select words"}
    >
      {selectMode ? (
        <X className="h-5 w-5" />
      ) : (
        <CheckSquare className="h-5 w-5" />
      )}
    </Button>
  );
}