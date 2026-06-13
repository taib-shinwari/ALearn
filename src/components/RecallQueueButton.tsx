import { useEffect, useState } from "react";
import { Inbox, Trash2, Clock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FullPageDialog } from "@/components/ui/full-page-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useApp } from "@/context/AppContext";
import { formatCountdown, isReady, type RecallItem } from "@/lib/recall";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

/**
 * Header button (sits next to Search). Opens a dialog with two tabs:
 * Active = items still cooling down. Recall = items ready to redo.
 */
export function RecallQueueButton() {
  const { recallQueue, removeRecallItem, setActiveRecall, browsePath, setRecallReturnPath } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, [open]);

  const now = Date.now();
  const active = recallQueue.filter(i => !isReady(i, now)).sort((a, b) => a.readyAt - b.readyAt);
  const ready = recallQueue.filter(i => isReady(i, now)).sort((a, b) => a.readyAt - b.readyAt);
  const hasReady = ready.length > 0;

  const openItem = (item: RecallItem) => {
    setOpen(false);
    setRecallReturnPath(browsePath);
    setActiveRecall({
      scope: item.scope,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      wordId: item.wordId,
    });
    navigate("/recall");
  };

  return (
    <>
      <Button
        size="icon"
        aria-label="Recall queue"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Inbox className="h-5 w-5" />
        {hasReady && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
            {ready.length}
          </span>
        )}
      </Button>
      <FullPageDialog open={open} onOpenChange={setOpen}>
        <Tabs defaultValue={hasReady ? "ready" : "active"} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="active">
              {t("activeTab") || "Active"} ({active.length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              {t("recallTab") || "Recall"} ({ready.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-2 mt-3">
            {active.length === 0 && (
              <p className="text-sm opacity-60 text-center py-6">
                {t("noActive") || "Nothing cooling down."}
              </p>
            )}
            {active.map(item => (
              <Row
                key={item.id}
                item={item}
                onDelete={() => removeRecallItem(item.id)}
                ready={false}
                t={t}
              />
            ))}
          </TabsContent>
          <TabsContent value="ready" className="space-y-2 mt-3">
            {ready.length === 0 && (
              <p className="text-sm opacity-60 text-center py-6">
                {t("noReady") || "Nothing to recall yet."}
              </p>
            )}
            {ready.map(item => (
              <Row
                key={item.id}
                item={item}
                onDelete={() => removeRecallItem(item.id)}
                onOpen={() => openItem(item)}
                ready
                t={t}
              />
            ))}
          </TabsContent>
        </Tabs>
      </FullPageDialog>
    </>
  );
}



function Row({
  item, onDelete, onOpen, ready, t,
}: {
  item: RecallItem;
  onDelete: () => void;
  onOpen?: () => void;
  ready: boolean;
  t: (k: string) => string;
}) {

  return (
    <Container className="flex items-center gap-2 p-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs opacity-60 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {ready ? "Ready" : formatCountdown(item.readyAt)}
          <span className="opacity-50">· ★{item.lastRating}</span>
        </p>
      </div>
      {ready && onOpen && (
        <Button size="icon" active onClick={onOpen} aria-label={t("startRecall") || "Start recall"}>
          <Play className="h-4 w-4" />
        </Button>
      )}
      <Button size="icon" onClick={onDelete} aria-label={t("deleteItem") || "Delete"}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </Container>
  );
}

