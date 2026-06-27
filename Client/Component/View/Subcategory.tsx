import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "Client/Component/UI/button";
import { CardButton } from "Client/Component/UI/card-button";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useCustomCollections } from "Client/Hook/useCustomCollections";
import { localizedName } from "Server/Data/courseData";
import { EmptyState } from "Client/Component/View/Chess";
import type { SupportedLang, ArabicLetterForms } from "Server/API/Language";

/* ─────────────────────────── Types ─────────────────────────── */

type Category = {
  id: string;
  name: { Dutch: string; English: string; Arabic?: string };
  subcategories: {
    id: string;
    name: { Dutch: string; English: string; Arabic?: string };
    words: { id: string }[];
  }[];
};

/* ─────────────────────────── SubcategoriesView ─────────────────────────── */

export function SubcategoriesView({ category, onOpen }: {
  category: Category;
  onOpen: (id: string) => void;
}) {
  const { uiLang, t } = useCourseLanguage(); // uiLang: I18nLang
  const { collections, addCollection, removeCollection } = useCustomCollections(category.id);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [name, setName]             = useState("");

  const all      = [...category.subcategories, ...collections];
  const isCustom = (sid: string) => collections.some(c => c.id === sid);

  return (
    <div className="px-4 space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex justify-end relative">
        <Button onClick={() => setMenuOpen(o => !o)} aria-label="Add">
          <Plus className="h-4 w-4 mr-1" />
          {t("add") || "Add"}
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
              onClick={() => { setMenuOpen(false); setAddColOpen(true); }}
            >
              {t("collection") || "Collection"}
            </button>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {all.length === 0 ? (
        <EmptyState uiLang={uiLang} kind="subcategories" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {all.map(sub => (
            <CardButton
              key={sub.id}
              onClick={() => onOpen(sub.id)}
              className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-3 relative"
            >
              <span className="font-semibold text-sm">{localizedName(sub.name, uiLang)}</span>
              <span className="text-xs opacity-70 whitespace-nowrap">{sub.words.length} {t("words")}</span>
              {isCustom(sub.id) && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove collection?")) removeCollection(category.id, sub.id);
                  }}
                  className="absolute top-1 right-1 p-1 opacity-60 hover:opacity-100"
                  aria-label="Remove collection"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </CardButton>
          ))}
        </div>
      )}

      {/* ── Add collection dialog ── */}
      <FullPageDialog
        open={addColOpen}
        onOpenChange={setAddColOpen}
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
            <Button onClick={() => { setAddColOpen(false); setName(""); }}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              active
              onClick={() => { addCollection(category.id, name); setAddColOpen(false); setName(""); }}
            >
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}