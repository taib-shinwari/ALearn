import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "Client/Component/UI/button";
import { CardButton } from "Client/Component/UI/card-button";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useCustomCollections } from "Client/Hook/useCustomCollections";
import { EmptyState } from "Client/Component/View/Chess";

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
  const { uiLang, i18nLang, t } = useCourseLanguage();
  const { collections, addCollection, removeCollection } = useCustomCollections(category.id);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [name, setName]             = useState("");

  const all      = [...category.subcategories, ...collections];
  const isCustom = (sid: string) => collections.some(c => c.id === sid);

  const handleCreateCollection = () => {
    if (!name.trim()) return;
    addCollection(category.id, name.trim());
    setAddColOpen(false);
    setName("");
  };

  return (
    <div className="px-4 space-y-4 max-w-3xl mx-auto w-full">
      {/* ── Toolbar Menu Row ── */}
      <div className="flex justify-end relative">
        <Button 
          onClick={() => setMenuOpen(o => !o)} 
          aria-label="Open adding menu options"
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t("add") || "Add"}
        </Button>
        
        {menuOpen && (
          <>
            {/* Click-away backdrop blanket closure safety shield layer */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
              <button
                type="button"
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-muted font-medium transition-colors"
                onClick={() => { setMenuOpen(false); setAddColOpen(true); }}
              >
                {t("collection") || "Collection"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Resource Items Grid Directory ── */}
      {all.length === 0 ? (
        <EmptyState uiLang={i18nLang} kind="subcategories" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {all.map(sub => {
            const subTitle = (sub.name as any)?.[uiLang] || sub.name?.English || sub.id;
            
            return (
              <CardButton
                key={sub.id}
                onClick={() => onOpen(sub.id)}
                className="min-h-[72px] p-4 flex items-center justify-between gap-4 relative group"
              >
                <div className="flex flex-col text-left min-w-0 pr-4">
                  <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {subTitle}
                  </span>
                  <span className="text-xs opacity-50 mt-0.5">
                    {sub.words?.length || 0} {t("words") || "Words"}
                  </span>
                </div>

                {isCustom(sub.id) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Remove custom collection?")) {
                        removeCollection(category.id, sub.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    aria-label="Remove collection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </CardButton>
            );
          })}
        </div>
      )}

      {/* ── Add Custom Target Collection Entry Form Modal Dialog ── */}
      <FullPageDialog
        open={addColOpen}
        onOpenChange={setAddColOpen}
        title={t("addCollection") || "Add Collection"}
      >
        <div className="space-y-4 max-w-sm mx-auto pt-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreateCollection(); }}
            placeholder={t("name") || "Name"}
            className="w-full px-3.5 py-2.5 rounded-[12px] border-2 border-border bg-background text-sm focus:outline-none focus:border-foreground transition-colors"
          />
          <div className="flex gap-2 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => { setAddColOpen(false); setName(""); }}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              active
              disabled={!name.trim()}
              onClick={handleCreateCollection}
            >
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}