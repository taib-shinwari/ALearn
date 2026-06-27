import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "Client/Component/UI/button";
import { Container } from "Client/Component/UI/container";
import { TitleBar } from "Client/Component/UI/title-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "Client/Component/UI/dialog";
import { speak, isSpeechAvailable } from "Client/Component/Practice/speech";
// ─── Corrected Import Path ───────────────────────────────────────────────────
import { findArabicForms, type I18nLang, type SupportedLang } from "Server/API/Language"; 
import {
  AlphabetActivityPicker, ListenAndWrite, MatchPairs, type AlphabetMode,
} from "Client/Component/Alphabet/AlphabetActivities";
import { cn } from "Client/Library/utils";

/* ─────────────────────────── Data ─────────────────────────── */

interface AlphabetTable {
  vowelsLabel: Record<I18nLang, string>;
  consonantsLabel: Record<I18nLang, string>;
  vowels: { letter: string; name?: string }[];
  consonants: { letter: string; name?: string }[];
}

const ALPHABET_TABLES: Record<I18nLang, AlphabetTable> = {
  Dutch: {
    vowelsLabel: { Dutch: "Klinkers", English: "Vowels", Arabic: "حروف العلة" },
    consonantsLabel: { Dutch: "Medeklinkers", English: "Consonants", Arabic: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u", "y"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  English: {
    vowelsLabel: { Dutch: "Klinkers", English: "Vowels", Arabic: "حروف العلة" },
    consonantsLabel: { Dutch: "Medeklinkers", English: "Consonants", Arabic: "الحروف الساكنة" },
    vowels: ["a", "e", "i", "o", "u"].map(l => ({ letter: l.toUpperCase() })),
    consonants: "bcdfghjklmnpqrstvwxyz".split("").map(l => ({ letter: l.toUpperCase() })),
  },
  Arabic: {
    vowelsLabel: { Dutch: "Lange klinkers", English: "Long vowels", Arabic: "حروف المد" },
    consonantsLabel: { Dutch: "Medeklinkers", English: "Consonants", Arabic: "الحروف الساكنة" },
    vowels: [
      { letter: "ا", name: "alif" },
      { letter: "و", name: "waw" },
      { letter: "ي", name: "ya" },
    ],
    consonants: [
      ["ب", "ba"], ["ت", "ta"], ["ث", "tha"], ["ج", "jim"], ["ح", "ha"], ["خ", "kha"],
      ["د", "dal"], ["ذ", "dhal"], ["ر", "ra"], ["ز", "zay"], ["س", "sin"], ["ش", "shin"],
      ["ص", "sad"], ["ض", "dad"], ["ط", "ta"], ["ظ", "za"], ["ع", "ayn"], ["غ", "ghayn"],
      ["ف", "fa"], ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
      ["ه", "ha"], ["ء", "hamza"],
    ].map(([letter, name]) => ({ letter, name })),
  },
};

/* ─────────────────────────── LetterCard ─────────────────────────── */

function LetterCard({ letter, name, lang }: { letter: string; name?: string; lang: SupportedLang }) {
  const canSpeak = isSpeechAvailable();
  const [open, setOpen] = useState(false);
  const forms = lang === "Arabic" ? findArabicForms(letter) : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => forms && setOpen(true)}
        className="block w-full text-left"
      >
        <Container className={cn(
          "p-3 flex flex-col items-center justify-center gap-1 aspect-square",
          forms && "hover:bg-foreground hover:text-background transition-colors cursor-pointer",
        )}>
          <span className="text-2xl font-bold leading-none">{letter}</span>
          {name && <span className="text-[10px] opacity-60">{name}</span>}
          {canSpeak && (
            <Button
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); speak(letter, lang); }}
              aria-label="Play"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </Container>
      </button>

      {forms && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-3xl">
                {letter} <span className="text-sm opacity-60 align-middle">— {forms.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {([
                ["Isolated", forms.isolated],
                ["Initial",  forms.initial],
                ["Medial",   forms.medial],
                ["Final",    forms.final],
              ] as const).map(([label, ch]) => (
                <Container key={label} className="p-4 flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold">{ch}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-wider">{label}</span>
                </Container>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* ─────────────────────────── AlphabetView ─────────────────────────── */

export function AlphabetView({ targetLang, uiLang }: { targetLang: SupportedLang; uiLang: I18nLang }) {
  const table = ALPHABET_TABLES[targetLang as I18nLang] ?? ALPHABET_TABLES.English;
  const showInteractive = targetLang === "English" || targetLang === "Dutch";
  const [mode, setMode] = useState<AlphabetMode>("viewer");

  return (
    <div className="w-full">
      <AlphabetActivityPicker
        targetLang={targetLang}
        uiLang={uiLang}
        mode={mode}
        setMode={setMode}
        showInteractive={showInteractive}
      />

      {mode === "listen" && showInteractive && (
        <ListenAndWrite targetLang={targetLang} uiLang={uiLang} />
      )}
      {mode === "match" && showInteractive && (
        <MatchPairs targetLang={targetLang} uiLang={uiLang} />
      )}

      {mode === "viewer" && (
        <div className="space-y-6 w-full px-4">
          <section className="space-y-3">
            <TitleBar className="font-semibold">{table.vowelsLabel[uiLang]}</TitleBar>
            <div className="grid grid-cols-6 gap-2">
              {table.vowels.map(v => <LetterCard key={v.letter} {...v} lang={targetLang} />)}
            </div>
          </section>
          <section className="space-y-3">
            <TitleBar className="font-semibold">{table.consonantsLabel[uiLang]}</TitleBar>
            <div className="grid grid-cols-6 gap-2">
              {table.consonants.map(c => <LetterCard key={c.letter} {...c} lang={targetLang} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}