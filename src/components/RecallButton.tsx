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
  /** When true the button is rendered full-width inside a header row. */
  fullWidth?: boolean;
}

/**
 * Inline "Recall" entry point shown on word- and subcategory-detail pages.
 * Disabled while the deck is in the Active cool-down — the queue panel is
 * then the only way to delete and redo it.
 */
export function RecallButton({ scope, categoryId, subcategoryId, wordId, className, fullWidth }: Props) {
  const navigate = useNavigate();
  const { recallQueue } = useApp();
  const { t } = useCourseLanguage();

  const id = recallId(scope, categoryId, subcategoryId, wordId);
  const queued = recallQueue.find(i => i.id === id);
  const cooling = queued && !isReady(queued);

  const go = () => {
    if (cooling) return;
    const base = `/recall/${categoryId}/${subcategoryId}`;
    navigate(wordId ? `${base}/${wordId}` : base);
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
      {ready ? (t("recallNow") || "Recall now") : (t("recall") || "Recall")}
    </Button>
  );
}
