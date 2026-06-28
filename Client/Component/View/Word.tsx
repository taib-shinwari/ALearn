import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Pencil, Star, Volume2 } from "lucide-react";
import { CardButton } from "Client/Component/UI/card-button";
import { RecallButton } from "Client/Component/RecallButton";
import { WordEditDialog } from "Client/Component/Word/WordEditDialog";
import { speak, isSpeechAvailable } from "Client/Component/Practice/speech";
import { useCourseLanguage } from "Client/Hook/useCourseLanguage";
import { useMarkedWords } from "Client/Hook/useMarkedWords";
import { useFavoriteWords } from "Client/Hook/useFavoriteWords";
import { useCustomWords } from "Client/Hook/useCustomWords";
import { fetchWordImage } from "Client/Library/wordImage";
import { cn } from "Client/Library/utils";
import type { WordDetail } from "Client/Hook/useCustomWords";
import type { WordLang } from "Client/Library/wordTypes";

/* ─────────────────────────── Types ─────────────────────────── */

type FlipState = 0 | 1 | 2;

/* ─────────────────────────── Section ─────────────────────────── */

function Section({ label, children, italic }: {
  label: string;
  children: React.ReactNode;
  italic?: boolean;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={cn("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}

/* ─────────────────────────── WordDetailView ─────────────────────────── */

export function WordDetailView({
  categoryId, subcategoryId, word, isCustom,
}: {
  categoryId: string;
  subcategoryId: string;
  word: WordDetail;
  isCustom?: boolean;
}) {
  const { uiLang, courseLang, t } = useCourseLanguage();
  const [flip, setFlip] = useState<FlipState>(0);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const { isMarked, toggle } = useMarkedWords();
  const { isFavorite, toggle: toggleFav } = useFavoriteWords();
  const { updateCustomWord, removeCustomWord, setOverride } = useCustomWords(categoryId, subcategoryId);
  const [editOpen, setEditOpen] = useState(false);

  const targetTextEarly = word[courseLang]?.word ?? word.en.word;
  const showImage = categoryId === "zelfstandig-naamwoord";

  useEffect(() => {
    setImgUrl(null);
    if (!targetTextEarly || !showImage) return;
    let cancelled = false;
    fetchWordImage({
      word: targetTextEarly,
      lang: courseLang,
      enWord: word.en.word,
      enDefinition: word.en.definition,
    }).then(url => {
      if (!cancelled) setImgUrl(url);
    });
    return () => { cancelled = true; };
  }, [word.id, targetTextEarly, courseLang, showImage]);

  const handleFlip = () => setFlip(f => ((f + 1) % 3) as FlipState);

  const cLang  = courseLang as WordLang;
  const interfaceWordLang: WordLang = uiLang === "ar" ? "en" : (uiLang as WordLang);
  const showLang: WordLang = flip === 2 ? interfaceWordLang : cLang;
  const dataFor = (lang: WordLang) => (lang === "ar" ? word.ar ?? word.en : word[lang]);
  const data = dataFor(showLang);

  const en = word.en;
  const nl = word.nl;
  const definition  = showLang === "nl" ? nl.definitie  : showLang === "ar" ? (word.ar?.definition ?? en.definition)  : en.definition;
  const plural      = showLang === "nl" ? nl.meervoud   : en.plural;
  const diminutive  = showLang === "nl" ? nl.verkleinwoord : en.diminutive;
  const conjugation = showLang === "nl" ? nl.vervoeging : en.conjugation;
  const example     = showLang === "nl" ? nl.voorbeeld  : showLang === "ar" ? (word.ar?.example ?? en.example) : en.example;
  const pronunciation = data.pronunciation;
  const gender = showLang === "nl" ? nl.gender : showLang === "en" ? en.gender : undefined;
  const genderLabel = gender === "m" ? t("masculine")
    : gender === "f" ? t("feminine")
    : gender === "n" ? t("neuter")
    : gender === "c" ? t("common") : null;

  const targetText = (cLang === "ar" ? word.ar?.word : word[cLang]?.word) ?? word.en.word;
  const frontPron  = (cLang === "ar" ? word.ar?.pronunciation : word[cLang]?.pronunciation) ?? undefined;
  const marked  = isMarked(courseLang as any, word.id);
  const favored = isFavorite(courseLang as any, word.id);
  const isFront = flip === 0;

  return (
    <div className="px-4 max-w-md mx-auto space-y-3">
      <RecallButton
        scope="word"
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        wordId={word.id}
        fullWidth
      />

      <CardButton
        onClick={handleFlip}
        className={cn("w-full relative", isFront ? "min-h-[140px]" : "min-h-[260px]")}
      >
        {/* ── Action buttons ── */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {!isFront && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border-2 border-border bg-background">
              {showLang}
            </span>
          )}
          {isSpeechAvailable() && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); speak(targetText, cLang); }}
              className="rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors"
              aria-label={t("play")}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(courseLang as any, word.id); }}
            className={cn(
              "rounded-full p-2 border-2 border-border transition-colors",
              marked ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
            )}
            aria-label={marked ? t("unmark") : t("mark")}
          >
            {marked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFav(courseLang as any, word.id); }}
            className={cn(
              "rounded-full p-2 border-2 border-border transition-colors",
              favored ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
            )}
            aria-label={favored ? (t("unfavorite") || "Unfavorite") : (t("favorite") || "Favorite")}
          >
            {favored ? <Star className="h-4 w-4 fill-current" /> : <Star className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            className="rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors"
            aria-label={t("editWord") || "Edit word"}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* ── Card body ── */}
        <div className="flex flex-col h-full">
          {isFront ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-1">
              <h1 className="text-3xl font-bold text-center">{targetText}</h1>
              {frontPron && <p className="text-sm opacity-70 font-mono">{frontPron}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center mb-2 pr-56">
                <h1 className="text-2xl font-bold">{data.word}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pronunciation && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border-2 border-border bg-background">
                    {pronunciation}
                  </span>
                )}
                {genderLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full border-2 border-border bg-background">
                    {t("gender")}: {genderLabel}
                  </span>
                )}
              </div>
              {definition  && <Section label={t("definition")}>{definition}</Section>}
              {plural      && <Section label={t("plural")}>{plural}</Section>}
              {diminutive  && <Section label={t("diminutive")}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation")}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{String(form ?? "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example")} italic>{example}</Section>}
            </>
          )}

          {imgUrl && (
            <div className="mt-4 rounded-[14px] overflow-hidden border-2 border-border bg-background aspect-[4/3]">
              <img
                src={imgUrl}
                alt={targetText}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => setImgUrl(null)}
              />
            </div>
          )}

          <p className="text-xs opacity-60 mt-4 text-center">{t("tapToFlip")}</p>
        </div>
      </CardButton>

      <WordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        word={word}
        onSave={(w) => {
          if (isCustom) updateCustomWord(word.id, w);
          else setOverride(word.id, w);
        }}
        onDelete={isCustom ? () => removeCustomWord(word.id) : undefined}
      />
    </div>
  );
}