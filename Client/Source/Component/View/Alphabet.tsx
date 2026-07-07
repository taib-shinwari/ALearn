import { useState, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/Component/UI/button";
import { Container } from "@/Component/UI/container";
import { TitleBar } from "@/Component/UI/title-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Component/UI/dialog";
import { speak, isSpeechAvailable } from "@/Component/Practice/speech";
import {
  AlphabetActivityPicker, ListenAndWrite, MatchPairs, type AlphabetMode,
} from "@/Component/Alphabet/AlphabetActivities";
import { cn } from "@/Library/utils";

export type SupportedLang   = "Dutch" | "English" | "Arabic" | "Pashto";
export type I18nLang        = "Dutch" | "English" | "Arabic";

export interface ArabicLetterForms {
  name: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

/* ─────────────────────────── Data ─────────────────────────── */

interface AlphabetTable {
  vowelsLabel: Record<I18nLang, string>;
  consonantsLabel: Record<I18nLang, string>;
  vowels: { letter: string; name?: string; corpusKey?: string }[];
  consonants: { letter: string; name?: string; corpusKey?: string }[];
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
      { letter: "ا", name: "alif", corpusKey: "alif" },
      { letter: "و", name: "waw", corpusKey: "waw" },
      { letter: "ي", name: "ya", corpusKey: "ya" },
    ],
    consonants: [
      ["ب", "ba", "ba"], ["ت", "ta", "ta"], ["ث", "tha", "tha"], ["ج", "jim", "jim"], 
      ["ح", "ha", "ha"], ["خ", "kha", "kha"], ["د", "dal", "dal"], ["ذ", "dhal", "dhal"], 
      ["ر", "ra", "ra"], ["ز", "zay", "zay"], ["س", "sin", "sin"], ["ش", "shin", "shin"],
      ["ص", "sad", "sad"], ["ض", "dad", "dad"], ["ط", "ta-2", "ta-alt"], ["ظ", "za", "za"], 
      ["ع", "ayn", "ayn"], ["غ", "ghayn", "ghayn"], ["ف", "fa", "fa"], ["ق", "qaf", "qaf"], 
      ["ك", "kaf", "kaf"], ["ل", "lam", "lam"], ["م", "mim", "mim"], ["ن", "nun", "nun"],
      ["ه", "ha-2", "ha-alt"], ["ء", "hamza", "hamza"],
    ].map(([letter, name, corpusKey]) => ({ letter, name, corpusKey })),
  },
};

/* ─────────────────────────── LetterCard ─────────────────────────── */

function LetterCard({ 
  letter, 
  name, 
  corpusKey, 
  lang, 
  corpusData 
}: { 
  letter: string; 
  name?: string; 
  corpusKey?: string;
  lang: SupportedLang; 
  corpusData: any;
}) {
  const canSpeak = isSpeechAvailable();
  const [open, setOpen] = useState(false);

  // Derive specialized Arabic calligraphic shapes directly out of the parsed network payload state
  const forms: ArabicLetterForms | undefined = (() => {
    if (lang !== "Arabic" || !corpusData?.arabicAlphabet || !corpusKey) return undefined;
    const raw = corpusData.arabicAlphabet[corpusKey];
    if (!raw) return undefined;
    const [isolated, initial, medial, final, formName] = raw;
    return { name: formName, isolated, initial, medial, final };
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => forms && setOpen(true)}
        className="block w-full text-left"
        disabled={!forms}
      >
        <Container className={cn(
          "p-3 flex flex-col items-center justify-center gap-2 aspect-square select-none w-full",
          forms && "hover:bg-foreground hover:text-background transition-colors cursor-pointer",
        )}>
          <span className="text-2xl font-bold leading-none">{letter}</span>
          {name && <span className="text-[10px] opacity-60 font-mono tracking-wide">{name}</span>}
          {canSpeak && (
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 mt-0.5 shrink-0"
              onClick={(e) => { 
                e.stopPropagation(); 
                speak(letter, (lang === "Arabic" ? "ar" : lang === "Dutch" ? "nl" : "en")); 
              }}
              aria-label="Play Audio Pronunciation"
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
                {letter} <span className="text-sm opacity-60 align-middle font-normal">— {forms.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {([
                ["Isolated", forms.isolated],
                ["Initial",  forms.initial],
                ["Medial",   forms.medial],
                ["Final",    forms.final],
              ] as const).map(([label, ch]) => (
                <Container key={label} className="p-4 flex flex-col items-center gap-1 bg-muted/40精准 context">
                  <span className="text-3xl font-bold">{ch || "—"}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-wider font-semibold">{label}</span>
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
  const showInteractive = ["English", "Dutch", "Arabic"].includes(targetLang);
  const [mode, setMode] = useState<AlphabetMode>("viewer");

  // Localized remote fetch orchestration hook
  const [corpusData, setCorpusData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    fetch(`${baseUrl}/api/language-corpus?lang=${targetLang}`)
      .then(res => res.json())
      .then(data => setCorpusData(data))
      .catch(err => console.error("Could not fetch alphabet forms from server corpus:", err))
      .finally(() => setLoading(false));
  }, [targetLang]);

  const SUPPORTED_TO_SHORT: Record<string, "en" | "nl" | "ar"> = {
    English: "en", Dutch: "nl", Arabic: "ar",
  };
  const shortTarget = (SUPPORTED_TO_SHORT[targetLang] ?? "en") as any;
  const shortUi     = (SUPPORTED_TO_SHORT[uiLang]     ?? "en") as any;

  if (loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing alphabet configurations...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <AlphabetActivityPicker
        targetLang={shortTarget}
        uiLang={shortUi}
        mode={mode}
        setMode={setMode}
        showInteractive={showInteractive}
      />

      {mode === "listen" && showInteractive && (
        <ListenAndWrite targetLang={shortTarget} uiLang={shortUi} />
      )}
      {mode === "match" && showInteractive && (
        <MatchPairs targetLang={shortTarget} uiLang={shortUi} />
      )}

      {mode === "viewer" && (
        <div className="space-y-6 w-full px-4 max-w-3xl mx-auto">
          <section className="space-y-3">
            <TitleBar className="font-semibold text-xs uppercase tracking-wider opacity-80">
              {table.vowelsLabel[uiLang] ?? table.vowelsLabel.English}
            </TitleBar>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {table.vowels.map(v => (
                <LetterCard 
                  key={v.letter} 
                  {...v} 
                  lang={targetLang} 
                  corpusData={corpusData} 
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <TitleBar className="font-semibold text-xs uppercase tracking-wider opacity-80">
              {table.consonantsLabel[uiLang] ?? table.consonantsLabel.English}
            </TitleBar>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {table.consonants.map(c => (
                <LetterCard 
                  key={c.letter} 
                  {...c} 
                  lang={targetLang} 
                  corpusData={corpusData} 
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}