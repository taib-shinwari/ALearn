import { useEffect, useState } from "react";
import { FullPageDialog } from "@/components/ui/full-page-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WordDetail } from "@/data/courseData";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  word?: WordDetail;          // undefined → add new
  onSave: (w: WordDetail) => void;
  onDelete?: () => void;      // only for custom words
}

function makeId(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `w-${Date.now()}`;
}

export function WordEditDialog({ open, onOpenChange, word, onSave, onDelete }: Props) {
  const { t } = useCourseLanguage();
  const [nlWord, setNlWord] = useState("");
  const [nlDef, setNlDef] = useState("");
  const [enWord, setEnWord] = useState("");
  const [enDef, setEnDef] = useState("");
  const [pron, setPron] = useState("");
  const [example, setExample] = useState("");

  useEffect(() => {
    if (!open) return;
    setNlWord(word?.nl?.word ?? "");
    setNlDef(word?.nl?.definitie ?? "");
    setEnWord(word?.en?.word ?? "");
    setEnDef(word?.en?.definition ?? "");
    setPron(word?.nl?.pronunciation ?? word?.en?.pronunciation ?? "");
    setExample(word?.nl?.voorbeeld ?? word?.en?.example ?? "");
  }, [open, word?.id]);

  const save = () => {
    if (!nlWord && !enWord) return;
    const id = word?.id ?? `c-${makeId(enWord || nlWord)}-${Date.now().toString(36)}`;
    const w: WordDetail = {
      id,
      nl: {
        ...(word?.nl || { word: "" }),
        word: nlWord || enWord,
        definitie: nlDef || undefined,
        voorbeeld: example || undefined,
        pronunciation: pron || undefined,
      },
      en: {
        ...(word?.en || { word: "" }),
        word: enWord || nlWord,
        definition: enDef || undefined,
        example: example || undefined,
        pronunciation: pron || undefined,
      },
      ar: word?.ar,
    };
    onSave(w);
    onOpenChange(false);
  };

  return (
    <FullPageDialog
      open={open}
      onOpenChange={onOpenChange}
      title={word ? (t("editWord") || "Edit word") : (t("addWord") || "Add word")}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs opacity-70">NL</label>
            <Input value={nlWord} onChange={e => setNlWord(e.target.value)} placeholder="woord" />
          </div>
          <div className="space-y-1">
            <label className="text-xs opacity-70">EN</label>
            <Input value={enWord} onChange={e => setEnWord(e.target.value)} placeholder="word" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("pronunciation") || "Pronunciation"}</label>
          <Input value={pron} onChange={e => setPron(e.target.value)} placeholder="[woord]" />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("definition") || "Definition"} (NL)</label>
          <Textarea value={nlDef} onChange={e => setNlDef(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("definition") || "Definition"} (EN)</label>
          <Textarea value={enDef} onChange={e => setEnDef(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("example") || "Example"}</label>
          <Textarea value={example} onChange={e => setExample(e.target.value)} rows={2} />
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        {onDelete && (
          <Button onClick={() => { onDelete(); onOpenChange(false); }} className="mr-auto">
            {t("delete") || "Delete"}
          </Button>
        )}
        <Button onClick={() => onOpenChange(false)} className="ml-auto">{t("cancel") || "Cancel"}</Button>
        <Button onClick={save} active>{t("save") || "Save"}</Button>
      </div>
    </FullPageDialog>
  );
}
