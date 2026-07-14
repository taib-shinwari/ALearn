import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useCustomWords, type WordDetail } from "@/Hook/useCustomWords";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button"; 
import { Container } from "@/Component/UI/container";
import { Input } from "@/Component/UI/Input";
import { Textarea } from "@/Component/UI/textarea";

function makeId(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `w-${Date.now()}`;
}

export function AddWord() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const { t } = useCourseLanguage();
  
  const { customWords, addCustomWord } = useCustomWords(
    categoryId || "", 
    subcategoryId || ""
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Embedded Form State ---
  const [nlWord, setNlWord] = useState("");
  const [nlDef, setNlDef] = useState("");
  const [enWord, setEnWord] = useState("");
  const [enDef, setEnDef] = useState("");
  const [pron, setPron] = useState("");
  const [example, setExample] = useState("");

  // Clear the inline form whenever the dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNlWord("");
      setNlDef("");
      setEnWord("");
      setEnDef("");
      setPron("");
      setExample("");
    }
  }, [isOpen]);

  const filteredWords = customWords.filter((word) =>
    !searchQuery || word.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSave = () => {
    if (!nlWord && !enWord) return;

    const generatedId = `c-${makeId(enWord || nlWord)}-${Date.now().toString(36)}`;
    const newWord: WordDetail = {
      id: generatedId,
      nl: {
        word: nlWord || enWord,
        definitie: nlDef || undefined,
        voorbeeld: example || undefined,
        pronunciation: pron || undefined,
      },
      en: {
        word: enWord || nlWord,
        definition: enDef || undefined,
        example: example || undefined,
        pronunciation: pron || undefined,
      },
    };

    addCustomWord(newWord);
    setIsOpen(false); // Close dropdown on successful save
  };

  const renderHeader = () => {
    const containerClasses = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";
    return (
      <Container className={containerClasses}>
        <Plus className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

  const renderTriggerIcon = () => {
    return <Plus className="h-5 w-5" />;
  };

  return (
    <NavigatorLayout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      inputRef={inputRef}
      buttonLabel="" 
      renderMobileHeaderLeft={renderHeader}
      renderDesktopHeaderLeft={renderHeader}
      showGoBack={false}
      disableHeaderContainer={true}
      customTrigger={renderTriggerIcon()}
      width="sm:w-[420px]"          // Custom desktop width override
  height="sm:max-h-[616px]"
    >
      <div className="flex flex-col gap-4 px-3 py-3 sm:p-4 w-full md:min-w-[360px] max-h-[80vh] overflow-y-auto relative">
        
        {/* INLINE FORM SECTIONS */}
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase px-1">
            {t("addWord") || "Add Word"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">NL</label>
              <Input 
                value={nlWord} 
                onChange={e => setNlWord(e.target.value)} 
                placeholder="woord" 
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">EN</label>
              <Input 
                value={enWord} 
                onChange={e => setEnWord(e.target.value)} 
                placeholder="word" 
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("pronunciation") || "Pronunciation"}
            </label>
            <Input 
              value={pron} 
              onChange={e => setPron(e.target.value)} 
              placeholder="[woord]" 
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("definition") || "Definition"} (NL)
            </label>
            <Textarea 
              value={nlDef} 
              onChange={e => setNlDef(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("definition") || "Definition"} (EN)
            </label>
            <Textarea 
              value={enDef} 
              onChange={e => setEnDef(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("example") || "Example"}
            </label>
            <Textarea 
              value={example} 
              onChange={e => setExample(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>
        </div>

        {/* FORM CONTROLS */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <Button 
            type="button"
            variant="ghost" 
            onClick={() => setIsOpen(false)} 
            className="flex-1 h-9 rounded-full text-sm font-medium"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button 
            type="button"
            onClick={handleSave} 
            active 
            className="flex-1 h-9 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90"
          >
            {t("save") || "Save"}
          </Button>
        </div>

        {/* PREVIOUSLY CREATED CUSTOM WORDS FEED */}
        {customWords.length > 0 && (
          <div className="border-t border-border/40 pt-3 mt-1">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-1 mb-2">
              Your Custom Words ({customWords.length})
            </p>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between h-8 px-3 rounded-full bg-muted/40 text-xs font-medium text-muted-foreground/80 border border-transparent"
                >
                  <span className="truncate">{word.id}</span>
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </NavigatorLayout>
  );
}