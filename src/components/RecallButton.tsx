import { useNavigate } from "react-router-dom";
import { Brain, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { formatCountdown, isReady, recallId, type RecallScope } from "@/lib/recall";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Props {
  scope: RecallScope;
  categoryId: string;
  subcategoryId: string;
  wordId?: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Inline "Recall" entry point shown on word- and subcategory-detail pages.
 * Disabled while the deck is cooling down.
 */
export function RecallButton({ scope, categoryId, subcategoryId, wordId, className, fullWidth }: Props) {
  const navigate = useNavigate();
  const { recallQueue, setActiveRecall, browsePath, setRecallReturnPath } = useApp();
  const { t } = useCourseLanguage();

  const id = recallId(scope, categoryId, subcategoryId, wordId);
  const queued = recallQueue.find(i => i.id === id);
  const cooling = queued && !isReady(queued);

  const go = () => {
    if (cooling) return;
    setRecallReturnPath(browsePath);
    setActiveRecall({ scope, categoryId, subcategoryId, wordId });
    navigate("/recall");
  };

  if (cooling) {
    return (
      <Button disabled className={className} fullWidth={fullWidth}>
        <Clock className="h-4 w-4 mr-2" />
        {(t("recall") || "Recall")} · {formatCountdown(queued!.readyAt)}
      </Button>
    );
  }

  const ready = !!queued && isReady(queued);
  return (
    <Button onClick={go} active={ready} className={className} fullWidth={fullWidth}>
      <Brain className="h-4 w-4 mr-2" />
      {t("recall") || "Recall"}
    </Button>
  );
}
