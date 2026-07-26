// @/Component/Word/Buttons/EditButton.tsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useCourseLanguage } from "@/Hook/useCourseLanguage";
import { useCustomWords, type WordDetail } from "@/Hook/useCustomWords";
import { NavigatorLayout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button"; 
import { Container } from "@/Component/UI/container";
import { Input } from "@/Component/UI/Input";
import { Textarea } from "@/Component/UI/textarea";
import { BACKEND_BASE_URL, DEFAULT_SECTION, wordDetailFromApi, SupportedLang } from "@/Library/Language";

export function EditButton() {
  const { langName, categoryId, subcategoryId, wordId } = useParams<{
    langName: string;
    categoryId: string;
    subcategoryId: string;
    wordId: string;
  }>();

  const navigate = useNavigate();
  const { t } = useCourseLanguage();
  const activeLangName = (langName || "English") as SupportedLang;

  const { customWords, updateCustomWord, removeCustomWord, setOverride } = useCustomWords(
    categoryId || "", 
    subcategoryId || ""
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Core Word Data State ---
  const [word, setWord] = useState<WordDetail | null>(null);

  // --- Embedded Form State ---
  const [nlWord, setNlWord] = useState("");
  const [nlDef, setNlDef] = useState("");
  const [enWord, setEnWord] = useState("");
  const [enDef, setEnDef] = useState("");
  const [pron, setPron] = useState("");
  const [example, setExample] = useState("");

  const isCustom = customWords.some(w => w.id === wordId);

  // Fetch target word data to populate the edit form when the dropdown opens
  useEffect(() => {
    if (!isOpen || !categoryId || !subcategoryId || !wordId) return;

    // Check if it's a custom word first
    const localWord = customWords.find(w => w.id === wordId);
    if (localWord) {
      setWord(localWord);
      populateForm(localWord);
      return;
    }

    // Fallback to fetch from corpus API
    fetch(`${BACKEND_BASE_URL}/api/language-corpus?lang=${encodeURIComponent(activeLangName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(corpus => {
        const subcategoryData = corpus?.vocabularyGrammar?.[DEFAULT_SECTION]?.[categoryId]?.[subcategoryId] || {};
        const rawWord = subcategoryData[wordId];

        if (rawWord) {
          const compiled = wordDetailFromApi(wordId, rawWord, activeLangName);
          setWord(compiled);
          populateForm(compiled);
        }
      })
      .catch((err) => {
        console.error("Failed loading word details in EditButton dropdown:", err);
      });
  }, [isOpen, activeLangName, categoryId, subcategoryId, wordId, customWords]);

  const populateForm = (w: WordDetail) => {
    setNlWord(w.nl?.word || "");
    setNlDef(w.nl?.definitie || "");
    setEnWord(w.en?.word || "");
    setEnDef(w.en?.definition || "");
    setPron(w.nl?.pronunciation || w.en?.pronunciation || "");
    setExample(w.nl?.voorbeeld || w.en?.example || "");
  };

  const handleSave = () => {
    if (!word || (!nlWord && !enWord)) return;

    const updatedFields: Partial<WordDetail> = {
      nl: {
        ...word.nl,
        word: nlWord || word.nl?.word || "",
        definitie: nlDef || undefined,
        voorbeeld: example || undefined,
        pronunciation: pron || undefined,
      },
      en: {
        ...word.en,
        word: enWord || word.en?.word || "",
        definition: enDef || undefined,
        example: example || undefined,
        pronunciation: pron || undefined,
      }
    };

    if (isCustom) {
      updateCustomWord(word.id, updatedFields);
    } else {
      setOverride(word.id, updatedFields);
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!word) return;
    if (isCustom) {
      removeCustomWord(word.id);
      setIsOpen(false);
      navigate(-1); // Go back as the word is deleted
    }
  };

  const renderHeader = () => {
    const containerClasses = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";
    return (
      <Container className={containerClasses}>
        <Pencil className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

  if (!wordId) return null;

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
      width="sm:w-[420px]"
      height="sm:h-[480px]"
      closedIcon={<Pencil />} // <-- Clean, customized icon config
    >
      <div className="flex flex-col gap-4 px-3 py-3 sm:p-4 w-full md:min-w-[360px] relative">
        
        {/* EDIT FORM SECTIONS */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase">
              {t("editWord") || "Edit Word"}
            </p>
            {isCustom && (
              <button 
                onClick={handleDelete}
                className="text-destructive hover:text-destructive/80 transition-colors"
                title="Delete Word"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

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
      </div>
    </NavigatorLayout>
  );
}