import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "Client/Component/UI/button";
import { CardButton } from "Client/Component/UI/card-button";
import { TitleBar } from "Client/Component/UI/title-bar";
import { FullPageDialog } from "Client/Component/UI/full-page-dialog";
import { useApp } from "Client/Context/App";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useCustomCollections } from "Client/Hook/useCustomCollections";
import {
  getCategories,
  getSubcategories,
  getLabel,
  type SupportedLang,
  type I18nLang,
} from "Server/API/Language";

/* ─────────────────────────── DictionaryBrowseView ─────────────────────────── */

// Legacy short-code → I18nLang map used by the UI layer
const TO_I18N: Record<string, I18nLang> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
};

/**
 * Resolve a localized name from a word-entry name field.
 * Accepts both full ("Dutch") and short ("nl") lang codes.
 */
function localizedName(name: Record<string, string> | string | undefined, lang: string): string {
  if (!name) return "";
  if (typeof name === "string") return name;
  const i18n = TO_I18N[lang] ?? lang;
  return name[i18n] ?? name[lang] ?? name["English"] ?? Object.values(name)[0] ?? "";
}

export function DictionaryBrowseView({ targetLang, targetLangCode }: { targetLang: SupportedLang; targetLangCode: string }) {
  const { uiLang, t } = useCourseLanguage();
  const { setBrowsePath } = useApp();

  const rootKey = `__lang_${targetLang}`;
  const { collections, addCollection, removeCollection } = useCustomCollections(rootKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [name, setName]         = useState("");

  // Derive the i18n lang for Server/API/Language calls
  const i18nLang: I18nLang = TO_I18N[uiLang] ?? "English";

  const categories = useMemo(() => {
    const builtIns = getCategories(targetLang, "Vocabulary").map(catId => ({
      id: catId,
      label: getLabel(i18nLang, catId) ?? catId,
      count: getSubcategories(targetLang, "Vocabulary", catId).length,
      custom: false,
    }));
    const custom = collections.map(col => ({
      id: col.id,
      label: localizedName(col.name, uiLang) || col.id,
      count: col.words?.length ?? 0,
      custom: true,
    }));
    return [...builtIns, ...custom];
  }, [targetLang, i18nLang, collections, uiLang]);

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

      <section>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <CardButton
              key={cat.id}
              onClick={() => setBrowsePath(["language", targetLangCode, "dictionary", "vocabulary", cat.id])}
              className="min-h-[64px] py-3 px-3 flex items-center justify-center text-center relative"
            >
              {cat.custom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove custom category?")) removeCollection(rootKey, cat.id);
                  }}
                  className="absolute top-2 right-2 opacity-50 hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="font-semibold">{cat.label}</span>
            </CardButton>
          ))}
        </div>
      </section>

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