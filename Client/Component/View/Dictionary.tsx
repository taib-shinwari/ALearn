import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "Client/Component/UI/button";
import { CardButton } from "Client/Component/UI/card-button";
import { Container } from "Client/Component/UI/container";
import { TitleBar } from "Client/Component/UI/title-bar";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import { useCustomCollections } from "Client/Hook/useCustomCollections";
import { categories, localizedName, type Lang } from "Server/Data/courseData";

/* ─────────────────────────── DictionaryBrowseView ─────────────────────────── */

const COLLECTIONS_LABEL: Record<Lang, string> = {
  nl: "Collecties",
  en: "Collections",
  ar: "المجموعات",
};

const EMPTY_LABEL: Record<Lang, string> = {
  nl: "Je woordenboek is leeg. Voltooi lessen om woorden toe te voegen.",
  en: "Your dictionary is empty. Complete lessons to add words.",
  ar: "قاموسك فارغ. أكمل الدروس لإضافة الكلمات.",
};

export function DictionaryBrowseView({ targetLang }: { targetLang: Lang }) {
  const { uiLang, t } = useCourseLanguage();
  const { pushBrowse, setBrowsePath } = useApp();
  const { map } = useMarkedWords();

  // State previously lifted into LanguageRootView — lives here now
  const rootKey = `__lang_${targetLang}`;
  const { collections, addCollection, removeCollection } = useCustomCollections(rootKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [name, setName]         = useState("");

  const markedIds = useMemo(() => new Set(map[targetLang] || []), [map, targetLang]);

  const grouped = useMemo(() => {
    return categories.flatMap(cat => {
      const subs = cat.subcategories.flatMap(sub => {
        const words = sub.words.filter(w => markedIds.has(w.id));
        return words.length > 0 ? [{ sub, words }] : [];
      });
      return subs.length > 0 ? [{ cat, subs }] : [];
    });
  }, [markedIds]);

  const hasAny = grouped.length > 0;

  return (
    <div className="px-4 w-full space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex justify-end relative">
        <Button onClick={() => setMenuOpen(o => !o)} aria-label="Add">
          <Plus className="h-4 w-4 mr-1" /> {t("add") || "Add"}
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
              onClick={() => { setMenuOpen(false); setAddOpen(true); }}
            >
              {t("collection") || "Collection"}
            </button>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {!hasAny && collections.length === 0 ? (
        <Container>
          <p className="text-sm text-center opacity-70">
            {EMPTY_LABEL[uiLang] ?? EMPTY_LABEL.en}
          </p>
        </Container>
      ) : (
        <div className="space-y-5">
          {/* ── Marked word groups ── */}
          {grouped.map(({ cat, subs }) => (
            <section key={cat.id} className="space-y-2">
              <TitleBar className="font-semibold">{localizedName(cat.name, uiLang)}</TitleBar>
              <div className="grid grid-cols-2 gap-3">
                {subs.map(({ sub, words }) => (
                  <CardButton
                    key={`${cat.id}-${sub.id}`}
                    onClick={() => setBrowsePath(["language", targetLang, "_marked", cat.id, sub.id])}
                    className="min-h-[64px] py-3 px-3 flex flex-col items-center justify-center text-center"
                  >
                    <span className="font-semibold">{localizedName(sub.name, uiLang)}</span>
                    <span className="text-xs opacity-70 mt-0.5">{words.length}</span>
                  </CardButton>
                ))}
              </div>
            </section>
          ))}

          {/* ── Custom collections ── */}
          {collections.length > 0 && (
            <section className="space-y-2">
              <TitleBar className="font-semibold">{COLLECTIONS_LABEL[uiLang]}</TitleBar>
              <div className="grid grid-cols-2 gap-3">
                {collections.map(col => (
                  <div key={col.id} className="space-y-2">
                    <TitleBar>
                      <span className="flex items-center justify-between w-full">
                        <span>{localizedName(col.name, uiLang)}</span>
                        <button
                          onClick={() => { if (confirm("Remove collection?")) removeCollection(rootKey, col.id); }}
                          className="opacity-60 hover:opacity-100"
                          aria-label="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    </TitleBar>
                    <CardButton
                      onClick={() => pushBrowse(col.id)}
                      className="min-h-[56px] py-2 px-3 flex items-center justify-center text-center"
                    >
                      <span className="text-xs opacity-70">0 {t("words")}</span>
                    </CardButton>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Add collection dialog ── */}
      <FullPageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title={t("addCollection") || "Add Collection"}
      >
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("name") || "Name"}
            className="w-full px-3 py-2 rounded-[10px] border-2 border-border bg-background text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => { setAddOpen(false); setName(""); }}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button active onClick={() => { addCollection(rootKey, name); setAddOpen(false); setName(""); }}>
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}